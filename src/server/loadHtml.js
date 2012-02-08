define('server/loadHtml', ['logger', 'server/testwindow', 'server/jasmineApi', 'scriptAccessor', 'server/clientInvoker', 'server/asyncWaitServer'], function (logger, testwindow, jasmineApi, scriptAccessor, clientInvoker, asyncWaitServer) {

    /**
     * List of regex. Scripts form the current document that match one of these regex
     * will be injected into the testwindow be loadHtml.
     */
    var _injectScripts = [];

    function injectScripts(scripts) {
        if (!scripts) {
            return _injectScripts;
        } else {
            _injectScripts = scripts;
        }
    }

    /**
     * Loads the given url into the testwindow.
     * Injects the scripts form injectScripts.
     * Dynamically adds an additional beforeLoad eventListener to the frame.
     * Integrates with jasmine and waits until the page is fully loaded.
     * <p>
     * Requires the following line at the beginning of the loaded document:
     * <pre>
     * opener && opener.instrument && opener.instrument(window);
     * </pre>
     * @param url
     * @param beforeLoadCallback A callback that will be executed right before the load event of the page.
     */
    function execute(url, beforeLoadCallback) {
        jasmineApi.runs(function () {

            var scriptUrls = [];
            scriptAccessor.findScripts(document, function (url) {
                for (var i = 0; i < _injectScripts.length; i++) {
                    if (url.match(_injectScripts[i])) {
                        scriptUrls.push(url);
                    }
                }
            });

            window.instrument = function (fr) {
                logger.log("Begin instrumenting frame " + fr.name + " with url " + fr.location.href);
                for (var i = 0; i < scriptUrls.length; i++) {
                    scriptAccessor.writeScriptWithUrl(fr.document, scriptUrls[i]);
                }
                if (beforeLoadCallback) {
                    window.afterScriptInjection = function () {
                        clientInvoker.addBeforeLoadListener(beforeLoadCallback);
                        beforeLoadCallback = null;
                    };
                    scriptAccessor.writeInlineScript(fr.document, 'opener.afterScriptInjection();');
                }
            };
            testwindow.get(url);
        });
        asyncWaitServer.waitsForAsync();
        jasmineApi.runs(function () {
            logger.log("Successfully loaded url " + url);
        });
    }

    return {
        execute: execute,
        injectScripts: injectScripts
    };
});