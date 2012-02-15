jasmineui.define('client/errorHandler', ['globals', 'remote!server/jasmineApi'], function (globals, jasmineApiRemote) {
    var window = globals.window;

    // Use a capturing listener so we receive all errors!
    window.addEventListener('error', errorHandler, true);

    /**
     * Error listener in the opened window to make the spec fail on errors.
     */
    function errorHandler(event) {
        jasmineApiRemote().fail(event.message);
    }
});