jasmineui.define('client/describeUi', ['logger', 'jasmineApi', 'client/asyncSensor', 'client/loadEventSupport', 'remote!server/describeUi'], function (logger, jasmineApi, asyncSensor, loadEventSupport, describeUiRemote) {
    var currentRemoteSpec = describeUiRemote().currentRemoteSpec;
    var remoteSpecPath = [].concat(currentRemoteSpec.specPath());
    var missingWaitsForReloadCount, originalReloadCount;
    var originalReloadCount = currentRemoteSpec.reloadCount();
    currentRemoteSpec.reloadCount(originalReloadCount + 1);

    function describe(name, callback) {
        if (name == remoteSpecPath[0]) {
            remoteSpecPath.shift();
            jasmineApi.describe(name, function () {
                missingWaitsForReloadCount = originalReloadCount;
                callback();
            });
        }
    }

    function describeUi(name, url, callback) {
        describe(name, function () {
            jasmineApi.beforeEach(function () {
                var localSpec = jasmineApi.getEnv().currentSpec;
                var remoteSpec = describeUiRemote().currentRemoteSpec;
                var _addMatcherResult = localSpec.addMatcherResult;
                localSpec.addMatcherResult = function (result) {
                    remoteSpec.addMatcherResult(result);
                    return _addMatcherResult.apply(this, arguments);
                };
                var _fail = localSpec.fail;
                localSpec.fail = function (error) {
                    remoteSpec.fail(error);
                    return _fail.apply(this, arguments);
                };
                waitsForAsync();
            });
            jasmineApi.afterEach(function () {
                var remoteSpec = describeUiRemote().currentRemoteSpec;
                remoteSpec.onComplete();
            });
            callback();
        });
    }

    function it(name, callback) {
        if (name == remoteSpecPath[0]) {
            remoteSpecPath.shift();
            jasmineApi.it.apply(this, arguments);
        }
    }

    function beforeEach(callback) {
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
            // Wait for a reload of the page...
            jasmineApi.waits(10000, "reload");
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
        beforeLoadCallbacks.push(callback);
    }

    loadEventSupport.addBeforeLoadListener(function () {
        for (var i = 0; i < beforeLoadCallbacks.length; i++) {
            beforeLoadCallbacks[i]();
        }
        jasmineApi.getEnv().execute();

    });

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