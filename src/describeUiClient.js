jasmineui.define('describeUiClient', ['logger', 'jasmineApi', 'persistentData', 'asyncSensor', 'loadEventSupport', 'globals', 'loadUrl', 'jasmineUtils'], function (logger, jasmineApi, persistentData, asyncSensor, loadEventSupport, globals, loadUrl, jasmineUtils) {
    var remoteSpec = persistentData().currentSpec;
    var originalReloadCount = remoteSpec.reloadCount || 0;
    var missingWaitsForReloadCount = originalReloadCount;

    function describeUi(name, url, callback) {
        jasmineApi.describe(name, callback);
    }

    function beforeEach(callback) {
        // Do not execute beforeEach if we are in a reload situation.
        if (originalReloadCount === 0) {
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
            waitsForAsync();
            jasmineApi.waitsFor.apply(this, arguments);
        }
    }

    function waits(callback) {
        if (missingWaitsForReloadCount === 0) {
            waitsForAsync();
            jasmineApi.waits.apply(this, arguments);
        }
    }

    function waitsForReload() {
        if (missingWaitsForReloadCount === 0) {
            remoteSpec.reloadCount = originalReloadCount + 1;
            // Wait for a reload of the page...
            jasmineUtils.createInfiniteWaitsBlock(jasmine.getEnv().currentSpec);
        } else {
            missingWaitsForReloadCount--;
        }
    }

    var waitsForAsyncTimeout = 5000;

    /**
     * Waits for the end of all asynchronous actions.
     */
    function waitsForAsync() {
        jasmineApi.runs(function () {
            logger.log("begin async waiting");
        });
        // Wait at least 50 ms. Needed e.g.
        // for animations, as the animation start event is
        // not fired directly after the animation css is added.
        // There may also be a gap between changing the location hash
        // and the hashchange event (almost none however...).
        jasmineApi.waits(50);
        jasmineApi.waitsFor(
            function () {
                return !asyncSensor();
            }, "async work", waitsForAsyncTimeout);
        jasmineApi.runs(function () {
            logger.log("end async waiting");
        });
    }

    function setWaitsForAsyncTimeout(_timeout) {
        waitsForAsyncTimeout = _timeout;
    }

    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        var suite = jasmineApi.getEnv().currentSuite;
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
            beforeLoadCallbacks[i]();
        }
    });

    globals.window.addEventListener('load', function () {
        jasmineApi.beforeEach(waitsForAsync);
        var specs = jasmineApi.getEnv().currentRunner().specs();
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
        it:it,
        describe:describe,
        describeUi:describeUi,
        beforeEach:beforeEach,
        waitsForReload:waitsForReload,
        beforeLoad:beforeLoad,
        waits:waits,
        waitsFor:waitsFor,
        runs:runs,
        setWaitsForAsyncTimeout:setWaitsForAsyncTimeout
    }
});
