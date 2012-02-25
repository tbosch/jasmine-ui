jasmineui.define('server/testwindow', ['scriptAccessor', 'globals'], function (scriptAccessor, globals) {
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
    var jasmineUiScriptUrl = scriptAccessor.jasmineUiScriptUrl;

    /**
     * Creates a testwindow with the given url.
     * Injects jasmineui into the window and all of the given scripts also after jasmineui is loaded.
     */
    function testwindow(url, scriptUrls) {
        if (arguments.length === 0) {
            return _testwindow;
        }
        if (url.charAt(0) !== '/') {
            // We need absolute paths because of the check later with location.pathname.
            throw new Error("Absolute paths are required");
        }
        if (!_testwindow) {
            _testwindow = window.open(url, 'jasmineui');
        }
        // The testwindow might contain old data.
        // Note: Be sure to always check this, even if we called window.open!
        // Reason. In FF and Chrome, a named window will be reused, even
        // if it was opened by another call to window.open!
        // In contrast for IE9, every call to window.open opens a new window!
        if (_testwindow.jasmineui) {
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
            scriptAccessor.writeScriptWithUrl(fr.document, jasmineUiScriptUrl);
            testwindow.afterJasmineUiInjection = function () {
                for (var i = 0; i < scriptUrls.length; i++) {
                    scriptAccessor.writeScriptWithUrl(fr.document, scriptUrls[i]);

                }
            };
        };

        return _testwindow;
    }

    return testwindow;

});