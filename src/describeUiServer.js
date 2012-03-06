jasmineui.define('describeUiServer', ['logger', 'jasmineApi', 'persistentData', 'loadUrl', 'scriptAccessor', 'globals', 'jasmineUtils'], function (logger, jasmineApi, persistentData, loadUrl, scriptAccessor, globals, jasmineUtils) {

    var utilityScripts = [];

    // Always add jasmine ui.
    utilityScripts.push(scriptAccessor.currentScriptUrl());

    function addWithoutDuplicates(list, entry) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == entry) {
                return;
            }
        }
        list.push(entry);
    }

    /**
     * Registers the current script as a utility script for ui tests.
     * The callback will only be executed on the client.
     * @param callback
     */
    function utilityScript(callback) {
        addWithoutDuplicates(utilityScripts, scriptAccessor.currentScriptUrl());
    }

    var itHandler, modeSet;

    if (persistentData().specResults) {
        setResultsMode(persistentData().specResults);
    }
    persistentData.clean();

    function setResultsMode(specResults) {
        modeSet = true;
        itHandler = function (spec) {
            // find the specResults...
            var pd = persistentData();
            for (var i = 0; i < specResults.length; i++) {
                var sr = specResults[i];
                if (sr.specPath.join('#') === jasmineUtils.specPath(spec).join('#')) {
                    spec.results_ = jasmineUtils.nestedResultsFromJson(sr.results);
                    break;
                }
            }
        }
    }

    function setInplaceMode() {
        if (modeSet) {
            return;
        }
        modeSet = true;
        jasmineApi.jasmine.getEnv().currentRunner().finishCallback = function () {
            var pd = persistentData();
            var specQueue = pd.specQueue;
            pd.specCount = specQueue.length;
            pd.currentSpec = specQueue.shift();
            pd.reporterUrl = globals.window.location.pathname;
            loadUrl(globals.window, pd.currentSpec.url);
        };
        itHandler = function (spec, pageUrl, currentScriptUrl) {
            var specStartData = {
                loadScripts:utilityScripts.concat([currentScriptUrl]),
                specPath:jasmineUtils.specPath(spec),
                url:pageUrl
            };
            var pd = persistentData();
            var specQueue = pd.specQueue = pd.specQueue || [];
            specStartData.index = specQueue.length;
            specQueue.push(specStartData);
        }

    }

    function setPopupMode() {
        if (modeSet) {
            return;
        }
        modeSet = true;
        var remoteWindow;
        var runner = jasmineApi.jasmine.getEnv().currentRunner();
        var _finishCallback = runner.finishCallback;
        runner.finishCallback = function () {
            remoteWindow.close();
            return _finishCallback.apply(this, arguments);
        };
        itHandler = function (spec, pageUrl, currentScriptUrl) {
            var specStartData = {
                loadScripts:utilityScripts.concat([currentScriptUrl]),
                specPath:jasmineUtils.specPath(spec)
            };
            if (!remoteWindow) {
                remoteWindow = globals.window.open(null, 'jasmineui');
            }
            loadUrl(remoteWindow, pageUrl);
            var pd = persistentData(remoteWindow);
            pd.currentSpec = specStartData;

            spec.addToQueue(jasmineUtils.createInfiniteWaitsBlock(spec));
        };
    }

    function setPopupSpecResults(results) {
        var spec = jasmineApi.jasmine.getEnv().currentSpec;
        var queue = spec.queue;
        var currentWaitsBlock = queue.blocks[queue.index];
        spec.results_ = jasmineUtils.nestedResultsFromJson(results);
        currentWaitsBlock.onComplete();
    }

    function pageUrl(suite) {
        if (arguments.length == 2) {
            suite.describeUiPageUrl = arguments[1];
            return;
        }
        if (!suite) {
            return null;
        }
        var res = suite.describeUiPageUrl;
        if (!res) {
            res = pageUrl(suite.parentSuite);
        }
        return res;
    }

    function scriptUrl(suite) {
        if (arguments.length == 2) {
            suite.describeUiScriptUrl = arguments[1];
            return;
        }
        if (!suite) {
            return null;
        }
        var res = suite.describeUiScriptUrl;
        if (!res) {
            res = scriptUrl(suite.parentSuite);
        }
        return res;
    }

    function describe(name, callback) {
        if (jasmineApi.jasmine.getEnv().currentSuite) {
            return jasmineApi.describe(name, callback);
        }
        // It is important to save the current script url at this early point, as the callback might be called at a later point.
        // E.g. during js-test-driver tests, the jasmine adapter delays the execution
        // of the callbacks!
        var currentScriptUrl = scriptAccessor.currentScriptUrl();
        jasmineApi.describe(name, function () {
            scriptUrl(jasmineApi.jasmine.getEnv().currentSuite, currentScriptUrl);
            callback();
        });
    }

    function describeUi(name, _pageUrl, callback) {
        jasmineApi.describe(name, function () {
            pageUrl(jasmineApi.jasmine.getEnv().currentSuite, _pageUrl);
            callback();
        });
    }

    function it(name, callback) {
        var suite = jasmineApi.jasmine.getEnv().currentSuite;
        var _pageUrl = pageUrl(suite);
        var currentScript = scriptUrl(suite);
        if (!_pageUrl) {
            jasmineApi.it(name, callback);
            return;
        }
        if (pageUrl) {
            var spec = jasmineApi.it(name, function () {
                var spec = jasmineApi.jasmine.getEnv().currentSpec;
                itHandler(spec, _pageUrl, currentScript);
            });
            // beforeEach and afterEach should only run in the client!
            spec.addBeforesAndAftersToQueue = function () {
            };
        }
    }

    return {
        describeUi:describeUi,
        describe:describe,
        it:it,
        utilityScript:utilityScript,
        setPopupSpecResults:setPopupSpecResults,
        setInplaceMode:setInplaceMode,
        setPopupMode:setPopupMode
    }
});