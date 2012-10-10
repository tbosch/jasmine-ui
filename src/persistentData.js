jasmineui.define('persistentData', ['globals', 'instrumentor'], function (globals, instrumentor) {

    function get() {
        var win = globals.window;
        var res = win.jasmineui && win.jasmineui.persistent;
        if (!res) {
            win.jasmineui = win.jasmineui || {};
            res = win.jasmineui.persistent = JSON.parse(win.sessionStorage.jasmineui_data || '{}');
            delete win.sessionStorage.jasmineui_data;
        }
        return res;
    }

    function setSessionStorage(target, property, value) {
        if (target===globals.window) {
            target.sessionStorage[property] = value;
        } else {
            // Note: in IE9 we cannot access target.sessionStorage directly,
            // so we need to use eval to set it :-(
            target.tmp = value;
            target.eval("sessionStorage."+property+" = window.tmp;");
        }
    }

    function saveDataToWindow(target) {
        var loaderString = instrumentor.loaderScript();
        var dataString = JSON.stringify(get());
        setSessionStorage(target, "jasmineui", loaderString);
        setSessionStorage(target, "jasmineui_data", dataString);
        if (target !== globals.window) {
            if (target.jasmineui) {
                delete target.jasmineui.persistent;
                if (target.jasmineui.notifyChange) {
                    target.jasmineui.notifyChange();
                }
            }
        }
    }

    var changeListeners = [];
    globals.window.jasmineui = globals.window.jasmineui || {};
    globals.window.jasmineui.notifyChange = function () {
        for (var i = 0; i < changeListeners.length; i++) {
            changeListeners[i]();
        }
    };

    function addChangeListener(listener) {
        changeListeners.push(listener);
    }

    get.addChangeListener = addChangeListener;
    get.saveDataToWindow = saveDataToWindow;

    return get;
});