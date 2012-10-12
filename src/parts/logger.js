jasmineui.define('logger', ['globals', 'config'], function (globals, config) {
    function log(msg1, msg2, msg3) {
        if (config.logEnabled) {
            // Note: console.log does not support .apply!
            if (arguments.length === 1) {
                console.log(msg1);
            }
            if (arguments.length === 2) {
                console.log(msg1, msg2);
            }
            if (arguments.length === 3) {
                console.log(msg1, msg2, msg3);
            }
        }
    }

    return {
        log:log
    };

});