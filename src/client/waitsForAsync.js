jasmineui.define('client/waitsForAsync', ['logger', 'client/remoteSpecClient', 'client/asyncSensor'], function (logger, remoteSpecClient, asyncSensor) {
    /**
     * Waits for the end of all asynchronous actions.
     * @param timeout
     */
    function waitsForAsync(timeout) {
        timeout = timeout || 5000;

        remoteSpecClient.runs(function () {
            logger.log("begin async waiting");
        });
        // Wait at least 50 ms. Needed e.g.
        // for animations, as the animation start event is
        // not fired directly after the animation css is added.
        // There may also be a gap between changing the location hash
        // and the hashchange event (almost none however...).
        remoteSpecClient.waits(100);
        remoteSpecClient.waitsFor(
            function () {
                return !asyncSensor();
            }, "async work", timeout);
        remoteSpecClient.runs(function () {
            logger.log("end async waiting");
        });
    }

    return waitsForAsync;
});