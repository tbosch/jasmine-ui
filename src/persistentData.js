jasmineui.define('persistentData', ['globals'], function (globals) {

    function save(win, data) {
        var MARKER;
        var helper = function () {
            window.jasmineui = window.jasmineui || {};
            var pd = window.jasmineui.persistent = MARKER || {};
            var currentSpec = pd.currentSpec;
            if (currentSpec) {
                var scripts = currentSpec.loadScripts;
                if (currentSpec.index) {
                    console.log("Jasmineui: Spec " + (currentSpec.index + 1) + "/" + pd.specCount + ": " + currentSpec.specPath.join(" "));
                }
                for (var i = 0; i < scripts.length; i++) {
                    window.document.writeln('<script type="text/javascript" src="' + scripts[i] + '"></script>');
                }
            }
        };
        var string = "(" + helper + ")()";
        string = string.replace("MARKER", JSON.stringify(data));
        win.sessionStorage.jasmineui = string;
    }

    function get(win) {
        win = win || globals.window;
        if (!win.jasmineui || !win.jasmineui.persistent) {
            win.jasmineui = win.jasmineui || {};
            win.jasmineui.persistent = {};
            if (win.sessionStorage.jasmineui) {
                win.eval(win.sessionStorage.jasmineui);
            }
        }
        if (!win.jasmineui.persistentUnload) {
            win.jasmineui.persistentUnload = true;
            win.addEventListener('beforeunload', function () {
                save(win, win.jasmineui.persistent);
            }, false);
        }

        return win.jasmineui.persistent;
    }

    function clean(win) {
        win = win || globals.window;
        win.jasmineui.persistent = {};
        save(win, win.jasmineui.persistent);
    }

    get.clean = clean;

    return get;
});