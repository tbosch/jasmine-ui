jasmineui.define('describeUiServer', ['config', 'jasmineApi', 'persistentData', 'scriptAccessor', 'globals', 'jasmineUtils'], function (config, jasmineApi, persistentData, scriptAccessor, globals, jasmineUtils) {

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

    var itHandler;

    if (persistentData().specs) {
        setResultsMode(persistentData().specs);
    } else if (config.popupMode) {
        setPopupMode();
    } else {
        setInplaceMode();
    }
    persistentData.clean();



    function setResultsMode(remoteSpecs) {
        itHandler = function (spec) {
            for (var i = 0; i < remoteSpecs.length; i++) {
                var executedSpec = remoteSpecs[i];
                if (executedSpec.specPath.join('#') === jasmineUtils.specPath(spec).join('#')) {
                    spec.results_ = jasmineUtils.nestedResultsFromJson(executedSpec.results);
                    break;
                }
            }
        }
    }

    function setInplaceMode() {
        jasmineApi.jasmine.Runner.prototype.finishCallback = function () {
            var pd = persistentData();
            pd.specIndex = 0;
            pd.reporterUrl = globals.window.location.href;
            persistentData.saveAndNavigateTo(globals.window, pd.specs[0].url);
        };
        itHandler = function (spec, pageUrl, currentScriptUrl) {
            var remoteSpec = {
                loadScripts:utilityScripts.concat([currentScriptUrl]),
                specPath:jasmineUtils.specPath(spec),
                url:pageUrl
            };
            var pd = persistentData();
            var remoteSpecs = pd.specs = pd.specs || [];
            remoteSpecs.push(remoteSpec);
        }

    }

    function setPopupMode() {
        var remoteWindow;
        // Note: js-test-driver creates an own Runner, so we need to
        // modify the prototype of the runner!
        var _finishCallback = jasmineApi.jasmine.Runner.prototype.finishCallback;
        jasmineApi.jasmine.Runner.prototype.finishCallback = function () {
            remoteWindow.close();
            return _finishCallback.apply(this, arguments);
        };
        itHandler = function (spec, pageUrl, currentScriptUrl) {
            var remoteSpec = {
                loadScripts:utilityScripts.concat([currentScriptUrl]),
                specPath:jasmineUtils.specPath(spec),
                url: pageUrl
            };
            if (!remoteWindow) {
                remoteWindow = globals.window.open(null, 'jasmineui');
            }
            var pd = persistentData();
            pd.specs = [remoteSpec];
            pd.specIndex = 0;
            persistentData.saveAndNavigateTo(remoteWindow, pageUrl);

            jasmineUtils.createInfiniteWaitsBlock(spec);
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
        describe(name, function () {
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

    function beforeLoad(callback) {
        // do nothing on the server side!
    }

    return {
        describeUi:describeUi,
        describe:describe,
        it:it,
        utilityScript:utilityScript,
        setPopupSpecResults:setPopupSpecResults,
        beforeLoad: beforeLoad
    }
});