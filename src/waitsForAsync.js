jasmineui.define('waitsForAsync', ['config', 'asyncSensor', 'jasmineApi', 'logger'], function (config, asyncSensor, jasmineApi, logger) {
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
            }, "async work", config.waitsForAsyncTimeout);
        jasmineApi.runs(function () {
            logger.log("end async waiting");
        });
    }

    return waitsForAsync;
});