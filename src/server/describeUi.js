jasmineui.define('server/describeUi', ['logger', 'jasmineApi', 'server/testwindow', 'scriptAccessor'], function (logger, jasmineApi, testwindow, scriptAccessor) {

    var utilityScripts = [];

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

    var itCalls = [];

    function it(name, callback) {
        itCalls.push(name);
    }

    var currentWaitsForRemoteSpecBlock;

    function createWaitsForRemoteSpecBlock(env, spec) {
        var res = {
            env:env,
            spec:spec,
            execute:function (onComplete) {
                res.onComplete = onComplete;
            }
        };
        return res;
    }

    var currentRemoteSpec;

    function createRemoteSpec(spec) {
        function onComplete(matcherResults, error) {
            for (var i = 0; i < matcherResults.length; i++) {
                spec.addMatcherResult(matcherResults[i]);
            }
            if (error) {
                spec.fail(error);
            }
            currentWaitsForRemoteSpecBlock.onComplete();
        }

        var specPath = [spec.description];
        var suite = spec.suite;
        while (suite) {
            specPath.unshift(suite.description);
            suite = suite.parentSuite;
        }

        var _reloadCount = 0;

        function reloadCount(value) {
            if (arguments.length == 0) {
                return _reloadCount;
            }
            _reloadCount = value;
        }

        return {
            onComplete:onComplete,
            specPath:specPath,
            reloadCount:reloadCount
        }
    }

    /**
     * Just like describe, but opens a window with the given url during the test.
     * @param name
     * @param pageUrl
     * @param callback
     */
    function describeUi(name, pageUrl, callback) {
        var currentScriptUrl = scriptAccessor.currentScriptUrl();

        function createRemoteIt(name) {
            var spec = jasmineApi.it(name);
            spec.runs(function () {
                var env = spec.env;
                currentRemoteSpec = createRemoteSpec(spec);
                spec.runs(function () {
                    testwindow(pageUrl, utilityScripts.concat([currentScriptUrl]));
                });
                currentWaitsForRemoteSpecBlock = createWaitsForRemoteSpecBlock(env, spec);
                spec.addToQueue(currentWaitsForRemoteSpecBlock);
            });
            // beforeEach and afterEach should only run in the testwindow!
            spec.addBeforesAndAftersToQueue = function () {
            };

        }

        function execute() {
            itCalls = [];
            callback();
            for (var i = 0; i < itCalls.length; i++) {
                createRemoteIt(itCalls[i]);
            }
        }

        describe(name, execute);
    }

    function describe(name, callback) {
        // This is important, as the callback might be called at a later point.
        // E.g. during js-test-driver tests, the jasmine adapter delays the execution
        // of the callbacks!
        jasmineApi.describe(name, scriptAccessor.preserveCurrentScriptUrl(callback));
    }

    return {
        describeUi:describeUi,
        describe:describe,
        it:it,
        utilityScript:utilityScript,
        currentRemoteSpec:{
            onComplete:function () {
                return currentRemoteSpec.onComplete.apply(this, arguments);
            },
            specPath:function () {
                return currentRemoteSpec.specPath;
            },
            reloadCount:function () {
                return currentRemoteSpec.reloadCount.apply(this, arguments);
            }
        }
    }
});