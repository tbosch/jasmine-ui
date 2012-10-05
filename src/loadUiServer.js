jasmineui.define('server?describeUiServer', ['config', 'persistentData', 'scriptAccessor', 'globals', 'testAdapter', 'urlLoader'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader) {

    // Always add jasmine ui as first entry
    var scriptUrls = [scriptAccessor.currentScriptUrl()];
    var firstLoadUiUrl;

    function loadUi(url, localScriptUrls) {
        scriptUrls.push(scriptAccessor.currentScriptUrl());
        if (localScriptUrls && localScriptUrls.concat) {
            scriptUrls = scriptUrls.concat(localScriptUrls);
        }
        if (!firstLoadUiUrl) {
            firstLoadUiUrl = url;
        }
    }

    if (persistentData().specs) {
        setResultsMode(persistentData().specs);
    } else if (config.loadMode === 'inplace') {
        setInplaceMode();
    } else {
        setPopupMode();
    }

    function setResultsMode(remoteSpecs) {
        var specIds = getSpecIds(remoteSpecs);
        testAdapter.replaceSpecRunner(function (specsCreatedCallback) {
            specsCreatedCallback(specIds);
            var i, spec;
            for (i = 0; i < remoteSpecs.length; i++) {
                spec = remoteSpecs[i];
                testAdapter.reportSpecResult(spec.id, spec.results);
            }
        });
    }

    function getSpecIds(remoteSpecs) {
        var i;
        var specIds = [];
        for (i=0; i<remoteSpecs.length; i++) {
            specIds.push(remoteSpecs[i].id);
        }
        return specIds;

    }

    function setInplaceMode() {
        testAdapter.replaceSpecRunner(function () {
            var firstUrl = prepareExecution();
            persistentData().reporterUrl = globals.window.location.href;
            urlLoader.navigateWithReloadTo(globals.window, firstUrl, 0);
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
            remoteWindow = globals.window.open(url, windowId);
        } else if (config.loadMode === 'iframe') {
            frameElement = document.createElement("iframe");
            frameElement.name = windowId;
            frameElement.setAttribute("src", url);
            frameElement.setAttribute("style", "position: absolute; bottom: 0px; z-index:100; width: "+window.innerWidth+"px; height: "+window.innerHeight+"px");
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

    function setPopupMode() {
        var specsCreatedCallback;

        testAdapter.replaceSpecRunner(function (_specsCreatedCallback) {
            // Now execute the ui specs
            var firstUrl = prepareExecution();
            openTestWindow(firstUrl);
            persistentData.saveDataToWindow(remoteWindow);
            // Now wait until the ui specs are finished and then call the finishedCallback
            specsCreatedCallback = _specsCreatedCallback;
        });

        persistentData.addChangeListener(function () {
            var pd = persistentData();
            if (pd.specIndex === 1) {
                // first call
                specsCreatedCallback(getSpecIds(pd.specs));
            }
            var spec = pd.specs[pd.specIndex - 1];
            testAdapter.reportSpecResult(spec.id, spec.results);
            if (pd.specIndex >= pd.specs.length) {
                // last call
                closeTestWindow();
            }
        });
    }


    function prepareExecution() {
        var pd = persistentData();
        pd.specs = [
            {
                loadScripts:scriptUrls,
                url:firstLoadUiUrl,
                id:null
            }
        ];
        pd.initialLoad = true;
        pd.specIndex = 0;
        return firstLoadUiUrl;
    }

    globals.jasmineui.loadUi = loadUi;

    return {
        loadUi:loadUi
    }
});