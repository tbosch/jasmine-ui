jasmineui.define('server/waitsForAsync', ['logger', 'server/jasmineApi', 'remote!', 'remote!client/asyncSensor'], function (logger, jasmineApi, remotePlugin, asyncSensorRemote) {
    var timeout = 5000;

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
                var testwin = remotePlugin.getWindow();
                if (!testwin) {
                    return false;
                }
                if (testwin.document.readyState !== 'complete') {
                    return false;
                }
                // On the first open, the testwindow contains the empty page,
                // which has document.readyState==complete, but nothing in it.
                if (!testwin.jasmineui) {
                    return false;
                }
                return !asyncSensorRemote()();
            }, "async work", timeout);
        jasmineApi.runs(function () {
            logger.log("end async waiting");
        });
    }

    function setTimeout(_timeout) {
        timeout = _timeout;
    }

    waitsForAsync.setTimeout = setTimeout;

    return waitsForAsync;
});