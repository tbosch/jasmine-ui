jasmineui.define('scriptAccessor', ['globals'], function (globals) {
    function writeScriptWithUrl(document, url) {
        document.writeln('<script type="text/javascript" src="' + url + '"></script>');
    }

    return {
        writeScriptWithUrl:writeScriptWithUrl
    }
});