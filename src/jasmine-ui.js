/**
 * Defines the modules of jasmine-ui.
 * Will also be used by the build command to append all files into
 * one file.
 */
(function () {
    window.jasmineui = window.jasmineui || {};

    jasmineui.currentScriptUrl = function () {
        var scriptNodes = document.getElementsByTagName("script");
        var lastNode = scriptNodes[scriptNodes.length - 1];
        return lastNode.src;
    };

    window.jasmineui.scriptUrl = jasmineui.currentScriptUrl();

    function script(url) {
        document.writeln('<script type="text/javascript" src="/jasmine-ui/src/' + url + '"></script>');
    }

    script('simpleRequire.js');
    script('scriptAccessor.js');
    script('logger.js');
    script('globals.js');
    script('server/describeUi.js');
    script('server/jasmineApi.js');
    script('server/remoteSpecServer.js');
    script('server/testwindow.js');
    script('server/waitsForAsync.js');
    script('client/asyncSensor.js');
    script('client/errorHandler.js');
    script('client/loadEventSupport.js');
    script('client/reloadMarker.js');
    script('client/remoteSpecClient.js');
    script('client/simulateEvent.js');
    script('main.js');
})();

