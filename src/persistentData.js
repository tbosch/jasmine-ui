jasmineui.define('persistentData', ['globals'], function (globals) {

    function loaderScript() {
        var helper = function () {
            var ns = window.jasmineui = window.jasmineui || {};
            ns.clientMode = true;

            var pd = ns.persistent = JSON.parse(sessionStorage.jasmineui_data || '{}');
            delete window.sessionStorage.jasmineui;
            delete window.sessionStorage.jasmineui_data;
            var currentSpec = pd.specs && pd.specs[pd.specIndex];
            if (currentSpec) {
                var output = '[';
                for (var i = 0; i < pd.specs.length; i++) {
                    var spec = pd.specs[i];
                    var state = ' ';
                    if (spec.results) {
                        state = spec.results.failedCount > 0 ? 'F' : '.';
                    }
                    output += state;
                }
                output += ']';
                if (window.console) {
                    window.console.log("Jasmineui: " + output + ": " + currentSpec.id);
                }
                var scripts = currentSpec.loadScripts;
                if (scripts) {
                    for (var i = 0; i < scripts.length; i++) {
                        window.document.writeln('<script type="text/javascript" src="' + scripts[i] + '"></script>');
                    }
                }
            }
        };
        return "(" + helper + ")(window)";
    }

    function get() {
        var win = globals.window;
        if (!win.jasmineui || !win.jasmineui.persistent) {
            win.jasmineui = win.jasmineui || {};
            win.jasmineui.persistent = JSON.parse(win.sessionStorage.jasmineui_data || '{}');
            delete win.sessionStorage.jasmineui_data;
        }
        return win.jasmineui.persistent;
    }

    function saveDataToWindow(target) {
        if (target === globals.window) {
            target.sessionStorage.jasmineui = loaderScript();
            target.sessionStorage.jasmineui_data = JSON.stringify(get());
        } else {
            // Note: in IE9 we cannot access target.sessionStorage directly,
            // so we need to use eval to set it :-(
            target.tmp = loaderScript();
            target.eval("sessionStorage.jasmineui = window.tmp;");
            target.tmp = JSON.stringify(get());
            target.eval("sessionStorage.jasmineui_data = window.tmp;");

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