jasmineui.define('server/loadUi', ['config', 'persistentData', 'scriptAccessor', 'globals', 'server/testAdapter', 'urlLoader'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader) {

    var firstLoadUiUrl;
    var testScripts = [];

    var GLOBAL_ERROR_SPEC_ID = "global#errors";

    var globalServerErrors = [];

    globals.window.addEventListener("error", function (event) {
        globalServerErrors.push({
            message:event.message
        });
    }, false);

    start();

    function loadUi(url) {
        testUrl(url);
        testScripts.push(scriptAccessor.currentScriptUrl());
        if (!firstLoadUiUrl) {
            firstLoadUiUrl = url;
        }
    }

    function testUrl(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();
        if (xhr.status != 200) {
            throw new Error("Could not find url " + url);
        }
    }

    function start() {
        var pd = persistentData();
        if (config.loadMode === 'inplace') {
            if (pd.specs) {
                if (pd.specIndex === -1) {
                    setInplaceFilterMode(pd.specs);
                } else {
                    setInplaceResultsMode(pd.specs);
                }
            } else {
                startInplaceMode();
            }
        } else {
            setPopupMode();
        }
    }

    function startInplaceMode() {
        testAdapter.replaceSpecRunner(function (runner) {
            var firstUrl = prepareExecution(runner);
            persistentData().reporterUrl = globals.window.location.href;
            urlLoader.navigateWithReloadTo(globals.window, firstUrl, 0);
        });
    }

    function setInplaceFilterMode(remoteSpecs) {
        var pd = persistentData();
        testAdapter.replaceSpecRunner(function (runner) {
            pd.specs = createAndFilterSpecs(runner, remoteSpecs);
            if (pd.specs.length) {
                // start the execution
                pd.specIndex = 0;
                urlLoader.navigateWithReloadTo(globals.window, remoteSpecs[0].url, 1);
            }
        });
    }

    function createAndFilterSpecs(runner, specs) {
        var pd = persistentData();
        var specIds = getSpecIds(specs);
        // if we have errors during analyze mode, create the global error spec for reporting it.
        if (pd.globalErrors.length) {
            specIds.unshift(GLOBAL_ERROR_SPEC_ID);
        }
        var filteredSpecIds = runner.createSpecs(specIds);
        if (pd.globalErrors.length) {
            runner.reportSpecResults({
                id:GLOBAL_ERROR_SPEC_ID,
                results:pd.globalErrors
            });
        }
        return filterSpecs(specs, filteredSpecIds);
    }

    function setInplaceResultsMode(remoteSpecs) {
        testAdapter.replaceSpecRunner(function (runner) {
            var specs = createAndFilterSpecs(runner, remoteSpecs);
            reportResults(runner, specs);
        });
    }

    function reportResults(runner, specs) {
        var i, spec;
        for (i = 0; i < specs.length; i++) {
            spec = specs[i];
            runner.reportSpecResults(spec);
        }
    }

    function getSpecIds(remoteSpecs) {
        var i;
        var specIds = [];
        for (i = 0; i < remoteSpecs.length; i++) {
            specIds.push(remoteSpecs[i].id);
        }
        return specIds;
    }

    function filterSpecs(specs, specIds) {
        var i, spec;
        var specIdsHash = {};
        for (i = 0; i < specIds.length; i++) {
            specIdsHash[specIds[i]] = true;
        }
        for (i = specs.length - 1; i >= 0; i--) {
            spec = specs[i];
            if (!specIdsHash[spec.id]) {
                specs.splice(i, 1);
            }
        }
        return specs;
    }

    function setPopupMode() {
        var runner;

        testAdapter.replaceSpecRunner(function (_runner) {
            // Now execute the ui specs
            var firstUrl = prepareExecution(_runner);
            var win = openTestWindow(firstUrl);
            persistentData.saveDataToWindow(win);
            // Now wait until the ui specs are finished and then call the finishedCallback
            runner = _runner;
        });

        globals.jasmineui.loadUiServer = {
            createSpecs:function (specs) {
                return createAndFilterSpecs(runner, specs);
            },
            specFinished:function (spec) {
                runner.reportSpecResults(spec);
            },
            runFinished:function () {
                closeTestWindow();
            }
        };
    }

    var remoteWindow;
    var frameElement;

    function openTestWindow(url) {
        if (remoteWindow) {
            remoteWindow.location.href = url;
            return remoteWindow;
        }
        var windowId = 'jasmineui-testwindow';
        if (config.loadMode === 'popup') {
            remoteWindow = globals.window.open(url, windowId);
        } else if (config.loadMode === 'iframe') {
            frameElement = document.createElement("iframe");
            frameElement.name = windowId;
            frameElement.setAttribute("src", url);
            frameElement.setAttribute("style", "position: absolute; bottom: 0px; z-index:100; width: " + window.innerWidth + "px; height: " + window.innerHeight + "px");
            document.body.appendChild(frameElement);
            remoteWindow = frames[windowId];
        } else {
            throw new Error("Unknown load mode " + config.loadMode);
        }
        return remoteWindow;
    }

    function closeTestWindow() {
        if (remoteWindow && config.closeTestWindow) {
            if (config.loadMode === 'popup') {
                remoteWindow.close();
            } else if (config.loadMode === 'iframe') {
                frameElement.parentElement.removeChild(frameElement);
            }
        }
        remoteWindow = null;
    }

    function prepareExecution(runner) {
        var pd = persistentData();
        pd.globalErrors = globalServerErrors;
        if (globalServerErrors.length > 0) {
            // abort the test execution!
            createAndFilterSpecs(runner, []);
            throw new Error("Ui tests not executed due to errors");
        }

        pd.analyzeScripts = testScripts;
        pd.specs = [];
        pd.specIndex = -1;
        pd.globalErrors = [];
        return firstLoadUiUrl;
    }

    return {
        globals: {
            jasmineui: {
                loadUi: loadUi
            }
        }
    }
});