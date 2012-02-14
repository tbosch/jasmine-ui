jasmineui.define('logger', ['globals'], function (globals) {
    function log(msg) {
        if (enabled()) {
            globals.console.log(msg);
        }
    }

    var _enabled;

    function enabled(value) {
        if (value === undefined) {
            return _enabled;
        } else {
            _enabled = value;
        }
    }

    return {
        log:log,
        enabled: enabled
    }

});