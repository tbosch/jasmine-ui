jasmineui.define('waitsForAsync', ['config', 'asyncSensor', 'jasmineApi', 'logger'], function (config, asyncSensor, jasmineApi, logger) {
    function checkAndWait() {
        // This is a loop between waiting 50 ms and checking
        // if any new async work started. This is needed
        // as a timeout might start a transition, which might
        // start another timeout, ...
        jasmineApi.runs(function() {
            if (asyncSensor()) {
                jasmineApi.waitsFor(
                    function () {
                        return !asyncSensor();
                    }, "async work", config.waitsForAsyncTimeout);
                jasmineApi.waits(100);
                checkAndWait();
            }
        });
    }

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
        jasmineApi.waits(100);
        checkAndWait();
        jasmineApi.runs(function () {
            logger.log("end async waiting");
        });
    }

    return waitsForAsync;
});