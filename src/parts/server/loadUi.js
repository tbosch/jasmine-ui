jasmineui.define('server/loadUi', ['config', 'persistentData', 'scriptAccessor', 'globals', 'server/testAdapter', 'urlLoader'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader) {

    var firstLoadUiUrl;
    var testScripts = [];

    var GLOBAL_ERROR_SPEC_ID = "global#errors";

    var globalServerErrors = [];

    globals.addEventListener("error", function (event) {
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
        var xhr = new globals.XMLHttpRequest();
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
                    runInplaceFilterPhase();
                } else {
                    runInplaceResultsPhase();
                }
            } else {
                runInplaceStartPhase();
            }
        } else {
            setPopupMode();
        }
    }

    function runInplaceStartPhase() {
        testAdapter.interceptSpecRunner(function (runner) {
            var firstUrl = prepareExecution(runner);
            if (!firstUrl) {
                return;
            }
            persistentData().reporterUrl = globals.location.href;
            urlLoader.navigateWithReloadTo(globals, firstUrl);
        });
    }

    function runInplaceFilterPhase() {
        var pd = persistentData();
        testAdapter.interceptSpecRunner(function (runner) {
            createAndFilterSpecs(runner);
            if (pd.specs.length) {
                // start the execution
                pd.specIndex = 0;
                urlLoader.navigateWithReloadTo(globals, pd.specs[0].url);
            }
        });
    }

    function runInplaceResultsPhase() {
        var pd = persistentData();
        testAdapter.interceptSpecRunner(function (runner) {
            createAndFilterSpecs(runner);
            var i, spec;
            for (i = 0; i < pd.specs.length; i++) {
                spec = pd.specs[i];
                testAdapter.reportSpecResults(spec);
            }
        });
    }

    function createAndFilterSpecs(runner) {
        var pd = persistentData();
        // if we have errors during analyze phase, create the global error spec for reporting it.
        if (pd.globalErrors.length) {
            var errorSpec = {
                id: GLOBAL_ERROR_SPEC_ID,
                results: pd.globalErrors
            };
            runner.createSpecs([errorSpec]);
            testAdapter.reportSpecResults(errorSpec);
            pd.specs = [];
        } else {
            pd.specs = runner.createSpecs(pd.specs);
        }
        return pd.specs;
    }

    function setPopupMode() {
        testAdapter.interceptSpecRunner(function (runner) {
            // Now execute the ui specs
            var firstUrl = prepareExecution(runner);
            if (!firstUrl) {
                return;
            }
            var win = openTestWindow(firstUrl);
            persistentData.saveDataToWindow(win);

            globals.jasmineui.loadUiServer = {
                createAndFilterSpecs:function () {
                    createAndFilterSpecs(runner);
                },
                specFinished:function (spec) {
                    testAdapter.reportSpecResults(spec);
                },
                runFinished:function () {
                    closeTestWindow();
                }
            };
        });
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
            remoteWindow = globals.open(url, windowId);
        } else if (config.loadMode === 'iframe') {
            frameElement = globals.document.createElement("iframe");
            frameElement.name = windowId;
            frameElement.setAttribute("src", url);
            frameElement.setAttribute("style", "position: absolute; bottom: 0px; z-index:100; width: " + window.innerWidth + "px; height: " + window.innerHeight + "px");
            globals.document.body.appendChild(frameElement);
            remoteWindow = globals.frames[windowId];
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

        pd.analyzeScripts = testScripts;
        pd.specs = [];
        pd.specIndex = -1;
        pd.globalErrors = globalServerErrors;
        if (!firstLoadUiUrl) {
            createAndFilterSpecs(runner);
            return null;
        }
        if (globalServerErrors.length > 0) {
            // abort the test execution!
            createAndFilterSpecs(runner);
            return null;
        }
        return firstLoadUiUrl;
    }

    return {
        globals:{
            jasmineui:{
                loadUi:loadUi
            }
        }
    }
});