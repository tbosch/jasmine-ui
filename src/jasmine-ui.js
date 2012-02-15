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

    window.jasmineui = window.jasmineui || {};

    function scriptUrlDetection() {
        // Note: We need to support both cases:
        // - development: jasmine-ui is split into multiple files.
        //   In that case, the scriptUrl is know first, and then addScriptUrlTo is called
        // - production case: jasmine-ui is built into one file.
        //   In that case, the addScriptUrlTo is called before the script url is known.
        var scriptUrl;
        var addScriptUrlList;
        window.jasmineui.addScriptUrlTo = function (list) {
            if (scriptUrl) {
                list.push(scriptUrl);
            }
            addScriptUrlList = list;
        };

        function scriptLoadListener(event) {
            if (event.target.nodeName === 'SCRIPT') {
                document.removeEventListener('load', scriptLoadListener, true);
                scriptUrl = event.target.src;
                if (addScriptUrlList) {
                    addScriptUrlList.push(scriptUrl);
                }
            }
        }

        // Use capturing event listener, as load event of script does not bubble!
        document.addEventListener('load', scriptLoadListener, true);

    }

    scriptUrlDetection();


})();

