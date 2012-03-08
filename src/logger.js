jasmineui.define('logger', ['globals', 'config'], function (globals, config) {
    function log(msg) {
        if (config.logEnabled) {
            globals.console.log(msg);
        }
    }

    return {
        log:log
    };

});