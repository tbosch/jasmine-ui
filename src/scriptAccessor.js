jasmineui.define('scriptAccessor', function () {
    function writeScriptWithUrl(document, url) {
        document.writeln('<script type="text/javascript" src="' + url + '"></script>');
    }

    function writeInlineScript(document, data) {
        document.writeln('<script type="text/javascript">' + data + '</script>');
    }

    /**
     * Calls the given callback after the current script finishes execution.
     * The callback will get one parameter with the url of the executed script.
     * @param callback
     */
    function afterCurrentScript(document, callback) {
        var loadListener = function (event) {
            var node = event.target;
            if (node.nodeName == 'SCRIPT') {
                callback(node.src);
                document.removeEventListener('load', loadListener, true);
            }
        };
        // Use capturing event listener, as load event of script does not bubble!
        document.addEventListener('load', loadListener, true);
    }


    return {
        writeScriptWithUrl:writeScriptWithUrl,
        writeInlineScript:writeInlineScript,
        afterCurrentScript:afterCurrentScript
    }
});