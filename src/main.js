(function () {
    var logEnabled = true;
    var waitsForAsyncTimeout = 5000;

    if (opener) {
        jasmineui.require(['logger', 'remote!', 'client/reloadMarker', 'client/remoteSpecClient', 'client/simulateEvent', 'remote!server/testwindow', 'client/errorHandler'], function (logger, remotePlugin, reloadMarker, remoteSpecClient, simulate, testwindowRemote) {
            logger.enabled(logEnabled);
            remotePlugin.setWindow(opener);
            window.xdescribe = function () {
            };
            window.xdescribeUi = function () {
            };
            window.xit = function () {
            };
            window.expect = opener.expect;
            window.jasmine = opener.jasmine;
            window.spyOn = opener.spyOn;

            window.describe = remoteSpecClient.describe;
            window.describeUi = remoteSpecClient.describeUi;
            window.it = remoteSpecClient.it;
            window.beforeEach = remoteSpecClient.beforeEach;
            window.afterEach = remoteSpecClient.afterEach;
            window.beforeLoad = remoteSpecClient.beforeLoad;
            window.runs = remoteSpecClient.runs;
            window.waitsFor = remoteSpecClient.waitsFor;
            window.waits = remoteSpecClient.waits;
            jasmineui.waitForReload = reloadMarker.requireReload;
            window.simulate = simulate;
            // Just call through.
            jasmineui.utilityScript = function(callback) {
                callback();
            };
            testwindowRemote().afterJasmineUiInjection();
        });
    } else {
        jasmineui.require(['server/remoteSpecServer', 'server/waitsForAsync', 'logger', 'server/describeUi'], function (remoteSpecServer, waitsForAsync, logger, describeUi) {
            logger.enabled(logEnabled);

            window.it = remoteSpecServer.it;
            window.beforeEach = remoteSpecServer.beforeEach;
            window.afterEach = remoteSpecServer.afterEach;
            window.beforeLoad = remoteSpecServer.beforeLoad;
            window.describeUi = remoteSpecServer.describeUi;
            window.describe = remoteSpecServer.describe;
            window.xdescribeUi = window.xdescribe;
            jasmineui.utilityScript = describeUi.utilityScript;

            waitsForAsync.setTimeout(waitsForAsyncTimeout);
        });
    }
})();
