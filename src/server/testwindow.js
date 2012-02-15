jasmineui.define('server/testwindow', ['remote!client/reloadMarker', 'scriptAccessor', 'globals'], function (reloadMarkerApi, scriptAccessor, globals) {
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

    /**
     * Creates a testwindow with the given url.
     * Injects the scripts with the given urls and calls the given callback after
     * the scripts were executed.
     */
    function testwindow(url, scriptUrls, callback) {
        if (arguments.length === 0) {
            return _testwindow;
        }
        if (url.charAt(0) !== '/') {
            // We need absolute paths because of the check later with location.pathname.
            throw new Error("Absolute paths are required");
        }
        if (!_testwindow) {
            _testwindow = window.open(url, 'jasmineui');
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
            for (var i = 0; i < scriptUrls.length; i++) {
                scriptAccessor.writeScriptWithUrl(fr.document, scriptUrls[i]);
            }
            globals.afterScriptInjection = function () {
                callback(fr);
            };
            scriptAccessor.writeInlineScript(fr.document, 'opener.afterScriptInjection();');
        };

        return _testwindow;
    }

    return testwindow;

});