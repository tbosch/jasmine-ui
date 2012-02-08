define('client/serverInvoker', [], function () {

    function addClientDefinedSpecNode(type, name, extraArgs) {
        window.opener.jasmineuiserver.addClientDefinedSpecNode(type, name, extraArgs);
    }

    function onScriptError(event) {
        opener.jasmine.getEnv().currentSpec.fail("Error from testwindow: " + event.message);
    }

    return {
        addClientDefinedSpecNode:addClientDefinedSpecNode,
        onScriptError: onScriptError
    };
});