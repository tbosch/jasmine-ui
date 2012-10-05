jasmineui.define('client?describeUiClient', ['persistentData', 'loadListener', 'globals', 'testAdapter', 'urlLoader', 'scriptAccessor'], function (persistentData, loadListener, globals, testAdapter, urlLoader, scriptAccessor) {
    // TODO move this to a utils.js
    var remoteSpec = persistentData().specs[persistentData().specIndex];

    loadListener.addLoadListener(function () {
        testAdapter.executeSpec(remoteSpec.id, function (specResult) {
            var pd = persistentData();
            remoteSpec.results = specResult;
            pd.specIndex = pd.specIndex + 1;
            var ownerWindow = globals.opener || globals.parent;
            if (ownerWindow) {
                persistentData.saveDataToWindow(ownerWindow);
            }
            var url;
            if (pd.specIndex < pd.specs.length) {
                url = pd.specs[pd.specIndex].url;
            } else {
                url = pd.reporterUrl;
            }
            if (url) {
                urlLoader.navigateWithReloadTo(globals.window, url);
            }
        });
    }, false);

    function findRemoteSpecById(specId) {
        var pd = persistentData();
        var i, spec;
        for (i = 0; i < pd.specs.length; i++) {
            spec = pd.specs[i];
            if (spec.id === specId) {
                return spec;
            }
        }
        return null;
    }

    var jasmineUiScriptUrl = scriptAccessor.currentScriptUrl();

    function loadUi(url, scriptUrls, callback) {
        if (arguments.length === 2) {
            callback = scriptUrls;
            scriptUrls = undefined;
        }
        callback();
        var pd = persistentData();
        var specIds = testAdapter.listSpecIds();
        var firstRemoteSpec = pd.specs[0];
        if (!firstRemoteSpec.id) {
            // The first spec does not have an id, as the server does not know it until now!
            firstRemoteSpec.id = specIds[0];
        }

        var loadScripts = [jasmineUiScriptUrl, scriptAccessor.currentScriptUrl()];
        if (scriptUrls) {
            loadScripts = loadScripts.concat(scriptUrls);
        }
        var i, specId, remoteSpec;
        for (i = 0; i < specIds.length; i++) {
            specId = specIds[i];
            remoteSpec = findRemoteSpecById(specId);
            if (!remoteSpec) {
                pd.specs.push({
                    loadScripts:loadScripts,
                    url:url,
                    id:specId
                });
            }
        }
    }

    globals.jasmineui.loadUi = loadUi;

    return {
        loadUi:loadUi
    }
});
