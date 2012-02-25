(function () {
    var logEnabled = true;
    var waitsForAsyncTimeout = 5000;

    if (opener) {
        jasmineui.require(['remote!'], function(remotePlugin) {
            remotePlugin.setWindow(opener);
        });
        jasmineui.require(['logger', 'client/describeUi', 'client/simulateEvent', 'remote!server/testwindow'], function (logger, describeUi, simulate, testwindowRemote) {
            logger.enabled(logEnabled);
            window.xdescribeUi = window.xdescribe;

            window.describe = describeUi.describe;
            window.describeUi = describeUi.describeUi;
            window.it = describeUi.it;
            window.beforeEach = describeUi.beforeEach;
            window.beforeLoad = describeUi.beforeLoad;
            window.runs = describeUi.runs;
            window.waitsFor = describeUi.waitsFor;
            window.waits = describeUi.waits;
            window.waitsForReload = describeUi.waitsForReload;
            describeUi.setWaitsForAsyncTimeout(waitsForAsyncTimeout);

            window.simulate = simulate;
            // Just call through.
            jasmineui.utilityScript = function (callback) {
                callback();
            };
            testwindowRemote().afterJasmineUiInjection();
        });
    } else {
        jasmineui.require(['logger', 'server/describeUi'], function (logger, describeUi) {
            logger.enabled(logEnabled);

            window.describeUi = describeUi.describeUi;
            window.it = describeUi.it;
            window.beforeLoad = function() {

            };
            window.describe = describeUi.describe;
            window.xdescribeUi = window.xdescribe;
            jasmineui.utilityScript = describeUi.utilityScript;

        });
    }
})();
