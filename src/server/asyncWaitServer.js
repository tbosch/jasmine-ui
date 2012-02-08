define('server/asyncWaitServer', ['server/jasmineApi', 'logger', 'server/clientInvoker', 'server/testwindow'], function (jasmineApi, logger, clientInvoker, testwindow) {
    /**
     * Waits for the end of all aynchronous actions.
     * @param timeout
     */
    function waitsForAsync(arg) {
        var timeout
        var requireReload = false;
        if (typeof arg === 'number') {
            timeout = arg;
        } else if (typeof arg === 'object') {
            timeout = arg.timeout;
            requireReload = arg.requireReload;
        }
        var timeout = timeout || 5000;

        jasmineApi.runs(function () {
            if (requireReload) {
                testwindow.requireReload();
            }
            logger.log("begin async waiting");
        });
        // Wait at least 50 ms. Needed e.g.
        // for animations, as the animation start event is
        // not fired directly after the animation css is added.
        // There may also be a gap between changing the location hash
        // and the hashchange event (almost none however...).
        jasmineApi.waits(100);
        jasmineApi.waitsFor(
            function () {
                return clientInvoker.ready() && !clientInvoker.isWaitForAsync();
            }, "end of async work", timeout);
        jasmineApi.runs(function () {
            logger.log("end async waiting");
        });
    }

    return {
        waitsForAsync:waitsForAsync
    }
});