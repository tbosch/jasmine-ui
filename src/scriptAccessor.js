jasmineui.define('scriptAccessor', ['globals'], function (globals) {

    function currentScriptUrl() {
        // Note: This also works with js-test-driver:
        // as js-test-driver loads one script after the other, and appends the
        // script at the end of the head tag.
        var scriptNodes = document.getElementsByTagName("script");
        var lastNode = scriptNodes[scriptNodes.length - 1];
        return lastNode.src;
    }

    return {
        currentScriptUrl:currentScriptUrl
    }
});