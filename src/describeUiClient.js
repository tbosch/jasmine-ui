jasmineui.define('describeUiClient', ['jasmineApi', 'persistentData', 'waitsForAsync', 'loadListener', 'globals', 'jasmineUtils', 'urlLoader', 'utils'], function (jasmineApi, persistentData, waitsForAsync, loadListener, globals, jasmineUtils, urlLoader, utils) {
    var remoteSpec = persistentData().specs[persistentData().specIndex];
    remoteSpec.lastRunsIndex = remoteSpec.lastRunsIndex || 0;

    var skipRunsCounter = remoteSpec.lastRunsIndex;
    var reloadHappened = false;

    function describeUi(name, url, callback) {
        describe(name, callback);
    }

    function describe(name, callback) {
        var suite = jasmineApi.jasmine.getEnv().currentSuite;
        var suitePath = jasmineUtils.suitePath(suite);
        var remoteSpecPath = remoteSpec.specPath;
        if (utils.isSubList(remoteSpecPath, suitePath.concat(name))) {
            jasmineApi.describe(name, callback);
        }
    }

    globals.window.addEventListener('beforeunload', function() {
        // Note: on iOS beforeunload is NOT supported.
        // In that case we rely on the fact, that timeouts no more executed
        // when a navigation change occurs. And we do wait some milliseconds between
        // every two runs statements using waitsForAsync.
        // On all other browsers, we use this flag to stop test execution.
        reloadHappened = true;
    });

    function runs(callback) {
        if (skipRunsCounter===0) {
            waitsForAsync();
            jasmineApi.runs.call(this, function() {
                if (reloadHappened) {
                    jasmineUtils.createInfiniteWaitsBlock(jasmineApi.jasmine.getEnv().currentSpec);
                } else {
                    callback();
                    // save the current state of the specs. Needed for specs that contain multiple reloads.
                    // As beforeunload does not work in iOS :-(
                    remoteSpec.lastRunsIndex++;
                    persistentData.saveDataToWindow(globals.window);
                }
            });
        } else {
            skipRunsCounter--;
        }
    }

    function waitsFor(callback) {
        if (skipRunsCounter === 0) {
            jasmineApi.waitsFor.apply(this, arguments);
        }
    }

    function waits(callback) {
        if (skipRunsCounter === 0) {
            jasmineApi.waits.apply(this, arguments);
        }
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
        beforeLoadCallbacks.push(callback);
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
            pd.specIndex = pd.specIndex + 1;
            if (globals.opener) {
                persistentData.saveDataToWindow(globals.opener);
            } else {
                var url;
                if (pd.specIndex < pd.specs.length) {
                    url = pd.specs[pd.specIndex].url;
                } else {
                    url = pd.reporterUrl;
                }
                urlLoader.navigateWithReloadTo(globals.window, url);
            }

        });
    }, false);

    function inject() {
        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];
            if (typeof arg === 'function') {
                arg();
            }
        }
    }

    return {
        describe:describe,
        describeUi:describeUi,
        beforeLoad:beforeLoad,
        waits:waits,
        waitsFor:waitsFor,
        runs:runs,
        inject: inject
    }
});
