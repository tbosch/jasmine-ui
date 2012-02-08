define('client/errorHandler', ['eventListener', 'client/serverInvoker'], function (eventListener, serverInvoker) {
    /**
     * Error listener in the opened window to make the spec fail on errors.
     */
    eventListener.addEventListener(window, 'error', serverInvoker.onScriptError);
});