jasmineui.define('client?loadUi', ['persistentData', 'globals', 'testAdapter', 'urlLoader', 'scriptAccessor', 'instrumentor', 'config', 'asyncSensor'], function (persistentData, globals, testAdapter, urlLoader, scriptAccessor, instrumentor, config, asyncSensor) {
    var pd = persistentData();

    function getOwnerLoadUiServer() {
        var owner = globals.opener || globals.parent;
        return owner && owner.jasmineui.loadUiServer;
    }
    var ownerLoadUiServer = getOwnerLoadUiServer();

    var analyzeMode = pd.specIndex === -1;
    if (analyzeMode) {
        startAnalyzeMode();
    } else {
        runMode();
    }

    function startAnalyzeMode() {
        addUtilScripts();
        var i;
        for (i = 0; i < pd.analyzeScripts.length; i++) {
            instrumentor.beginScript(pd.analyzeScripts[i]);
        }
        asyncSensor.afterAsync(function() {
            if (ownerLoadUiServer) {
                pd.specs = ownerLoadUiServer.createSpecs(pd.specs);
                runNextSpec();
            } else {
                // In inplace mode, we need to call the spec runner again to
                // filter the collected specs.
                urlLoader.navigateWithReloadTo(globals.window, pd.reporterUrl);
            }
        });
    }

    function runMode() {
        var remoteSpec = pd.specs[pd.specIndex];
        logSpecStatus(remoteSpec);
        addUtilScripts();
        instrumentor.beginScript(remoteSpec.testScript);
        asyncSensor.afterAsync(function () {
            testAdapter.executeSpec(remoteSpec.id, function (specResult) {
                remoteSpec.results = specResult;
                if (ownerLoadUiServer) {
                    ownerLoadUiServer.specFinished(remoteSpec);
                }
                runNextSpec();
            });
        });
    }

    function runNextSpec() {
        pd.specIndex = pd.specIndex + 1;
        var url;
        if (pd.specIndex < pd.specs.length) {
            url = pd.specs[pd.specIndex].url;
        } else {
            if (ownerLoadUiServer) {
                ownerLoadUiServer.runFinished();
            } else {
                url = pd.reporterUrl;
            }
        }
        if (url) {
            urlLoader.navigateWithReloadTo(globals.window, url);
        }
    }


    function addUtilScripts() {
        var i, script;
        // first add the configured scripts
        for (i = 0; i < config.scripts.length; i++) {
            script = config.scripts[i];
            if (script.position === 'begin') {
                instrumentor.beginScript(script.url);
            } else {
                instrumentor.endScript(script.url);
            }
        }
    }

    function logSpecStatus(remoteSpec) {
        if (!globals.console) {
            return;
        }

        var output = '[';
        for (var i = 0; i < pd.specs.length; i++) {
            var spec = pd.specs[i];
            var state = ' ';
            if (spec.results) {
                state = spec.results.failedCount > 0 ? 'F' : '.';
            }
            output += state;
        }
        output += ']';
        globals.console.log("Jasmineui: " + output + ": " + remoteSpec.id);
    }

    function findRemoteSpecById(specId) {
        var i, spec;
        for (i = 0; i < pd.specs.length; i++) {
            spec = pd.specs[i];
            if (spec.id === specId) {
                return spec;
            }
        }
        return null;
    }

    function loadUi(url, callback) {
        callback();
        if (analyzeMode && pd.analyzeScripts) {
            var specIds = testAdapter.listSpecIds();
            var scriptUrl = scriptAccessor.currentScriptUrl();
            var i, specId, remoteSpec;
            for (i = 0; i < specIds.length; i++) {
                specId = specIds[i];
                remoteSpec = findRemoteSpecById(specId);
                if (!remoteSpec) {
                    pd.specs.push({
                        testScript:scriptUrl,
                        url:url,
                        id:specId
                    });
                }
            }
        }
    }

    globals.jasmineui.loadUi = loadUi;

    return {
        loadUi:loadUi
    }
});
