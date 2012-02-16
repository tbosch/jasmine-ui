jasmineui.define('server/testwindow', ['remote!', 'remote!client/reloadMarker', 'scriptAccessor', 'globals'], function (remotePlugin, reloadMarkerApi, scriptAccessor, globals) {
    var window = globals.window;

    function splitAtHash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos != -1) {
            return [url.substring(0, hashPos), url.substring(hashPos + 1)];
        } else {
            return [url, ''];
        }
    }

    var _testwindow;
    var jasmineUiScriptUrl = globals.jasmineui.scriptUrl;

    /**
     * Creates a testwindow with the given url.
     * Injects jasmineui into the window. When jasmineui is ready,
     * calls the given callback.
     */
    function testwindow(url, callback) {
        if (arguments.length === 0) {
            return _testwindow;
        }
        if (url.charAt(0) !== '/') {
            // We need absolute paths because of the check later with location.pathname.
            throw new Error("Absolute paths are required");
        }
        if (!_testwindow) {
            _testwindow = window.open(url, 'jasmineui');
            remotePlugin.setWindow(_testwindow);
        } else {
            // Set a flag to detect whether the
            // window is currently in a reload cycle.
            reloadMarkerApi(_testwindow).requireReload();
            var oldPath = _testwindow.location.pathname;
            // if only the hash changes, the
            // page will not reload by assigning the href but only
            // change the hashpath.
            // So detect this and do a manual reload.
            var urlSplitAtHash = splitAtHash(url);
            if (oldPath === urlSplitAtHash[0]) {
                _testwindow.location.hash = urlSplitAtHash[1];
                _testwindow.location.reload();
            } else {
                _testwindow.location.href = url;
            }
        }

        globals.instrument = function (fr) {
            testwindow.afterJasmineUiInjection = function () {
                callback(fr);
            };
            scriptAccessor.writeScriptWithUrl(fr.document, jasmineUiScriptUrl);
        };

        return _testwindow;
    }

    return testwindow;

});