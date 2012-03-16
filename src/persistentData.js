jasmineui.define('persistentData', ['globals'], function (globals) {

    function serialize(data) {
        var MARKER;
        var helper = function () {
            window.jasmineui = window.jasmineui || {};
            var pd = window.jasmineui.persistent = MARKER || {};
            delete window.sessionStorage.jasmineui;
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
                    window.console.log("Jasmineui: " + output + ": " + currentSpec.specPath.join(" "));
                }
                var scripts = currentSpec.loadScripts;
                if (scripts) {
                    for (var i = 0; i < scripts.length; i++) {
                        window.document.writeln('<script type="text/javascript" src="' + scripts[i] + '"></script>');
                    }
                }
            }
        };
        var string = "(" + helper + ")(window)";
        return string.replace("MARKER", JSON.stringify(data));
    }

    function get() {
        var win = globals.window;
        if (!win.jasmineui || !win.jasmineui.persistent) {
            // Note: This variable is used by the eval! By this, we can
            // isolate the eval call during unit tests!
            var window = win;
            eval(win.sessionStorage.jasmineui);
            win.jasmineui = win.jasmineui || {};
            win.jasmineui.persistent = win.jasmineui.persistent || {};
        }
        return win.jasmineui.persistent;
    }

    function saveDataToWindow(target) {
        if (target === globals.window) {
            target.sessionStorage.jasmineui = serialize(get());
        } else {
            // Note: in IE9 we cannot access target.sessionStorage directly,
            // so we need to use eval to set it :-(
            target.tmp = serialize(get());
            target.eval("sessionStorage.jasmineui = window.tmp;");
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