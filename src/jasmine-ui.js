/**
 * Defines the modules of jasmine-ui.
 * Will also be used by the build command to append all files into
 * one file.
 * @param src
 */
(function () {
    function script(url) {
        document.write('<script type="text/javascript" src="/jasmine-ui/src/' + url + '"></script>');
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

    function scriptLoadListener(event) {
        if (event.target.nodeName === 'SCRIPT') {
            document.removeEventListener('load', scriptLoadListener, true);
            window.jasmineui = window.jasmineui || {};
            window.jasmineui.scripturl = event.target.src;
        }
    }

    // Use capturing event listener, as load event of script does not bubble!
    document.addEventListener('load', scriptLoadListener, true);

})();

