jasmineui.define('client?jasmine/waitsForAsync', ['config', 'asyncSensor', 'jasmine/original', 'logger'], function (config, asyncSensor, jasmineOriginal, logger) {
    function checkAndWait() {
        // This is a loop between waiting 50 ms and checking
        // if any new async work started. This is needed
        // as a timeout might start a transition, which might
        // start another timeout, ...
        jasmineOriginal.runs(function() {
            if (asyncSensor()) {
                jasmineOriginal.waitsFor(
                    function () {
                        return !asyncSensor();
                    }, "async work", config.waitsForAsyncTimeout);
                jasmineOriginal.waits(100);
                checkAndWait();
            }
        });
    }

    /**
     * Waits for the end of all asynchronous actions.
     */
    function waitsForAsync() {
        jasmineOriginal.runs(function () {
            logger.log("begin async waiting");
        });


        // Wait at least 50 ms. Needed e.g.
        // for animations, as the animation start event is
        // not fired directly after the animation css is added.
        // There may also be a gap between changing the location hash
        // and the hashchange event (almost none however...).
        jasmineOriginal.waits(100);
        checkAndWait();
        jasmineOriginal.runs(function () {
            logger.log("end async waiting");
        });
    }

    function runs(callback) {
        waitsForAsync();
        jasmineOriginal.runs(callback);
    }

    jasmineOriginal.beforeEach(waitsForAsync);

    return {
        waitsForAsync: waitsForAsync,
        runs: runs
    };
});