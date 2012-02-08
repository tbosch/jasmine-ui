var logEnabled = true;

if (opener && opener.jasmineuiserver) {
    require(['logger', 'client/asyncWaitClient', 'client/remoteSpecClient', 'eventListener', 'simulateEvent', 'client/errorHandler'], function (logger, asyncWaitClient, remoteSpecClient, eventListener, simulate) {
        logger.enabled(logEnabled);
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
        window.waitsForAsync = remoteSpecClient.waitsForAsync;
        window.jasmineuiclient = {
            executeSpecNode:remoteSpecClient.executeSpecNode,
            isWaitForAsync:asyncWaitClient.isWaitForAsync,
            addBeforeLoadListener:eventListener.addBeforeLoadListener
        };
        window.simulate = simulate;

    });


} else {
    require(['server/remoteSpecServer', 'server/loadHtml', 'logger', 'server/testwindow'], function (remoteSpecServer, loadHtml, logger, testwindow) {
        logger.enabled(logEnabled);

        loadHtml.injectScripts([
            'jasmine-ui[^/]*$', 'UiSpec[^/]*$', 'UiHelper[^/]*$' ]);

        window.it = remoteSpecServer.it;
        window.beforeEach = remoteSpecServer.beforeEach;
        window.afterEach = remoteSpecServer.afterEach;
        window.beforeLoad = remoteSpecServer.beforeLoad;
        window.describeUi = remoteSpecServer.describeUi;
        window.describe = remoteSpecServer.describe;
        window.xdescribeUi = window.xdescribe;

        window.jasmineuiserver = {
            addClientDefinedSpecNode:remoteSpecServer.addClientDefinedSpecNode
        };
    });
}