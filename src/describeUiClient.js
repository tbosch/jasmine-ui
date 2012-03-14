jasmineui.define('describeUiClient', ['jasmineApi', 'persistentData', 'waitsForAsync', 'loadListener', 'globals', 'jasmineUtils'], function (jasmineApi, persistentData, waitsForAsync, loadListener, globals, jasmineUtils) {
    var remoteSpec = persistentData().specs[persistentData().specIndex];
    var originalReloadCount = remoteSpec.reloadCount || 0;
    var missingWaitsForReloadCount = originalReloadCount;
    // Note: We need to increment the reloadCount here,
    // and not in a runs statement in the waitsForReload.
    // Reason: Jasmine sometimes executes runs statements using window.setTimeout.
    // After location.reload() was called, those timeouts may not be executed!
    remoteSpec.reloadCount = originalReloadCount+1;

    function describeUi(name, url, callback) {
        jasmineApi.describe(name, callback);
    }

    function beforeEach(callback) {
        // Do not execute beforeEach if we are in a reload situation.
        if (!originalReloadCount) {
            jasmineApi.beforeEach.apply(this, arguments);
        }
    }

    function runs(callback) {
        if (missingWaitsForReloadCount === 0) {
            waitsForAsync();
            jasmineApi.runs.apply(this, arguments);
        }
    }

    function waitsFor(callback) {
        if (missingWaitsForReloadCount === 0) {
            jasmineApi.waitsFor.apply(this, arguments);
        }
    }

    function waits(callback) {
        if (missingWaitsForReloadCount === 0) {
            jasmineApi.waits.apply(this, arguments);
        }
    }

    function waitsForReload() {
        persistentData.enableSaveToSession();
        if (missingWaitsForReloadCount === 0) {
            // Wait for a reload of the page...
            var spec = jasmineApi.jasmine.getEnv().currentSpec;
            jasmineUtils.createInfiniteWaitsBlock(spec);
        } else {
            missingWaitsForReloadCount--;
        }
    }


    function isSubList(list, suitePath) {
        var execute = true;
        for (var i = 0; i < suitePath.length; i++) {
            if (i >= list.length || list[i] != suitePath[i]) {
                execute = false;
                break;
            }
        }
        return execute;
    }

    function findRemoteSpecLocally() {
        var specs = jasmineApi.jasmine.getEnv().currentRunner().specs();
        var spec;
        var remoteSpecId = remoteSpec.specPath.join('#');
        for (var i = 0; i < specs.length; i++) {
            var currentSpecId = jasmineUtils.specPath(specs[i]).join('#');
            if (currentSpecId == remoteSpecId) {
                spec = specs[i];
                break;
            }
        }
        if (!spec) {
            throw new Error("could not find spec with path " + remoteSpec.specPath);
        }
        return spec;
    }

    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        var suite = jasmineApi.jasmine.getEnv().currentSuite;
        var suitePath = jasmineUtils.suitePath(suite);
        var remoteSpecPath = remoteSpec.specPath;
        if (isSubList(remoteSpecPath, suitePath)) {
            beforeLoadCallbacks.push(callback);
        }
    }

    loadListener.addBeforeLoadListener(function () {
        var localSpec = findRemoteSpecLocally();
        for (var i = 0; i < beforeLoadCallbacks.length; i++) {
            try {
                beforeLoadCallbacks[i]();
            } catch (e) {
                localSpec.fail(e);
            }
        }
    });

    loadListener.addLoadListener(function () {
        jasmineApi.beforeEach(waitsForAsync);
        var spec = findRemoteSpecLocally();
        if (remoteSpec.results) {
            // If we had existing results from a reload situation, load them into the spec.
            spec.results_ = jasmineUtils.nestedResultsFromJson(remoteSpec.results);
        }
        remoteSpec.results = spec.results_;
        spec.execute(function () {
            var pd = persistentData();
            persistentData.disableSaveToSession();
            pd.specIndex = pd.specIndex + 1;
            if (globals.opener) {
                persistentData.saveToHashAndNavigateTo(globals.opener, pd.reporterUrl);
            } else {
                var url;
                if (pd.specIndex < pd.specs.length) {
                    url = pd.specs[pd.specIndex].url;
                } else {
                    url = pd.reporterUrl;
                }
                persistentData.saveAndNavigateWithReloadTo(globals.window, url);
            }

        });
    }, false);

    function utilityScript(callback) {
        callback();
    }

    return {
        describe:describe,
        describeUi:describeUi,
        beforeEach:beforeEach,
        waitsForReload:waitsForReload,
        beforeLoad:beforeLoad,
        waits:waits,
        waitsFor:waitsFor,
        runs:runs,
        utilityScript: utilityScript
    }
});
