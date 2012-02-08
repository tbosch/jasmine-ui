/**
 * Invoker to access the testwindow from the server.
 */
define('server/clientInvoker', ['server/testwindow'], function (testwindow) {
    function client() {
        var win = testwindow.get();
        return win && win.jasmineuiclient;
    }

    function addBeforeLoadListener(listener) {
        client().addBeforeLoadListener(listener);
    }

    function isWaitForAsync() {
        return client().isWaitForAsync();
    }

    function executeSpecNode(nodePath) {
        return client().executeSpecNode(nodePath);
    }

    function ready() {
        return testwindow.ready() && !!client();
    }

    return {
        addBeforeLoadListener:addBeforeLoadListener,
        isWaitForAsync:isWaitForAsync,
        executeSpecNode:executeSpecNode,
        ready: ready
    }
});