jasmineui.define('describeUiClient', ['jasmineApi', 'persistentData', 'waitsForAsync', 'loadEventSupport', 'globals', 'loadUrl', 'jasmineUtils'], function (jasmineApi, persistentData, waitsForAsync, loadEventSupport, globals, loadUrl, jasmineUtils) {
    var remoteSpec = persistentData().currentSpec;
    var missingWaitsForReloadCount = remoteSpec.reloadCount || 0;

    function describeUi(name, url, callback) {
        jasmineApi.describe(name, callback);
    }

    function beforeEach(callback) {
        // Do not execute beforeEach if we are in a reload situation.
        if (!remoteSpec.reloadCount) {
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
        if (missingWaitsForReloadCount === 0) {
            jasmineApi.runs(function() {
                remoteSpec.reloadCount = (remoteSpec.reloadCount || 0) + 1;
            });
            // Wait for a reload of the page...
            jasmineUtils.createInfiniteWaitsBlock(jasmineApi.jasmine.getEnv().currentSpec);
        } else {
            missingWaitsForReloadCount--;
        }
    }


    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        var suite = jasmineApi.jasmine.getEnv().currentSuite;
        var suitePath = jasmineUtils.suitePath(suite);
        var remoteSpecPath = remoteSpec.specPath;
        for (var i = 0; i < suitePath.length; i++) {
            if (i >= remoteSpecPath.length || remoteSpecPath[i] != suitePath[i]) {
                return;
            }
        }
        beforeLoadCallbacks.push(callback);
    }

    loadEventSupport.addBeforeLoadListener(function () {
        for (var i = 0; i < beforeLoadCallbacks.length; i++) {
            // TODO add try/catch here,
            // catch the error and save it as an expectationresult in the spec...
            // TODO get the spec...
            beforeLoadCallbacks[i]();
        }
    });

    loadEventSupport.addLoadListener(function () {
        jasmineApi.beforeEach(waitsForAsync);
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
        if (remoteSpec.specResults) {
            // If we had existing results, load them into the spec.
            spec.results_ = jasmineUtils.nestedResultsFromJson(remoteSpec.specResults);
        }
        remoteSpec.results = spec.results_;
        spec.execute(function () {
            var pd = persistentData();
            if (globals.opener) {
                globals.opener.jasmineui.require(['describeUiServer'], function (describeUiServer) {
                    describeUiServer.setPopupSpecResults(spec.results_);
                });
            } else {
                pd.specResults = pd.specResults || [];
                pd.specResults.push(pd.currentSpec);
                delete pd.currentSpec;
                var nextEntry = pd.specQueue.shift();
                if (nextEntry) {
                    pd.currentSpec = nextEntry;
                    loadUrl(globals.window, nextEntry.url);
                } else {
                    loadUrl(globals.window, pd.reporterUrl);
                }
            }

        });
    }, false);

    return {
        describe:describe,
        describeUi:describeUi,
        beforeEach:beforeEach,
        waitsForReload:waitsForReload,
        beforeLoad:beforeLoad,
        waits:waits,
        waitsFor:waitsFor,
        runs:runs
    }
});
