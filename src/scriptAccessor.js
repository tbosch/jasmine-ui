jasmineui.define('scriptAccessor', ['globals'], function (globals) {
    function writeScriptWithUrl(document, url) {
        document.writeln('<script type="text/javascript" src="' + url + '"></script>');
    }

    var tmpScriptUrl;
    function currentScriptUrl() {
        if (tmpScriptUrl) {
            return tmpScriptUrl;
        }
        // Note: This also works with js-test-driver:
        // as js-test-driver loads one script after the other, and appends the
        // script at the end of the head tag.
        var scriptNodes = document.getElementsByTagName("script");
        var lastNode = scriptNodes[scriptNodes.length - 1];
        return lastNode.src;
    }

    function preserveCurrentScriptUrl(callback) {
        var scriptUrl = currentScriptUrl();
        return function() {
            var old = tmpScriptUrl;
            tmpScriptUrl = scriptUrl;
            var res = callback.apply(this,arguments);
            tmpScriptUrl = old;
            return res;
        }
    }

    var jasmineUiScriptUrl = currentScriptUrl();

    return {
        writeScriptWithUrl:writeScriptWithUrl,
        currentScriptUrl:currentScriptUrl,
        preserveCurrentScriptUrl:preserveCurrentScriptUrl,
        jasmineUiScriptUrl:jasmineUiScriptUrl
    }
});