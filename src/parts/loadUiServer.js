jasmineui.define('server?loadUi', ['config', 'persistentData', 'scriptAccessor', 'globals', 'testAdapter', 'urlLoader'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader) {

    var firstLoadUiUrl;
    var testScripts = [];

    start();

    function loadUi(url) {
        testScripts.push(scriptAccessor.currentScriptUrl());
        if (!firstLoadUiUrl) {
            firstLoadUiUrl = url;
        }
    }

    function start() {
        var pd = persistentData();
        if (config.loadMode==='inplace') {
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
        testAdapter.replaceSpecRunner(function () {
            var firstUrl = prepareExecution();
            persistentData().reporterUrl = globals.window.location.href;
            urlLoader.navigateWithReloadTo(globals.window, firstUrl, 0);
        });
    }

    function setInplaceFilterMode(remoteSpecs) {
        var pd = persistentData();
        testAdapter.replaceSpecRunner(function (runner) {
            var filteredSpecIds = runner.createSpecs(getSpecIds(remoteSpecs));
            pd.specs = filterSpecs(pd.specs, filteredSpecIds);
            // start the execution
            pd.specIndex = 0;
            urlLoader.navigateWithReloadTo(globals.window, remoteSpecs[0].url, 1);
        });

    }

    function setInplaceResultsMode(remoteSpecs) {
        var specIds = getSpecIds(remoteSpecs);
        testAdapter.replaceSpecRunner(function (runner) {
            runner.createSpecs(specIds);
            var i, spec;
            for (i = 0; i < remoteSpecs.length; i++) {
                spec = remoteSpecs[i];
                runner.reportSpecResult(spec.id, spec.results);
            }
        });
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
        for (i=0; i<specIds.length; i++) {
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
            var firstUrl = prepareExecution();
            openTestWindow(firstUrl);
            persistentData.saveDataToWindow(remoteWindow);
            // Now wait until the ui specs are finished and then call the finishedCallback
            runner = _runner;
        });

        globals.jasmineui.loadUiServer = {
            createSpecs: function(specs) {
                var filteredSpecIds = runner.createSpecs(getSpecIds(specs));
                return filterSpecs(specs, filteredSpecIds);
            },
            specFinished: function(spec) {
                runner.reportSpecResult(spec.id, spec.results);
            },
            runFinished: function() {
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
            throw new Error("Unknown load mode " + loadMode);
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

    function prepareExecution() {
        var pd = persistentData();
        pd.analyzeScripts = testScripts;
        pd.specs = [];
        pd.specIndex = -1;
        return firstLoadUiUrl;
    }

    globals.jasmineui.loadUi = loadUi;

    return {
        loadUi:loadUi
    }
});