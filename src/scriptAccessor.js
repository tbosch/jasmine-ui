define('scriptAccessor', function () {
    /**
     * Loops through the scripts of the current document and
     * calls a callback with their url.
     * @param urlCallback
     */
    function findScripts(document, urlCallback) {
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            if (script.src) {
                urlCallback(script.src);
            }
        }
    }

    function writeScriptWithUrl(document, url) {
        document.writeln('<script type="text/javascript" src="' + url + '"></script>');
    }

    function writeInlineScript(document, data) {
        document.writeln('<script type="text/javascript"">' + data + '</script>');
    }


    return {
        findScripts:findScripts,
        writeScriptWithUrl:writeScriptWithUrl,
        writeInlineScript:writeInlineScript
    }
});