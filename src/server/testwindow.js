define('server/testwindow', function () {
    function splitAtHash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos != -1) {
            return [url.substring(0, hashPos), url.substring(hashPos + 1)];
        } else {
            return [url, ''];
        }
    }

    var testwindow;
    var requireReloadFlag = 'testwindow#requiresReload';

    /**
     * testwindow(url): This function is able to create a testframe
     * with a given url.
     */
    function get(url) {
        if (arguments.length > 0) {
            if (!url.charAt(0) == '/') {
                throw new Error("the url for the testframe needs to be absolute!");
            }
            if (!testwindow) {
                testwindow = window.open(url, 'jasmineui');
            } else {
                // Set a flag to detect whether the
                // window is currently in a reload cycle.
                requireReload();
            }
            var oldPath = testwindow.location.pathname;
            // if only the hash changes, the
            // page will not reload by assigning the href but only
            // change the hashpath.
            // So detect this and do a manual reload.
            var urlSplitAtHash = splitAtHash(url);
            if (oldPath === urlSplitAtHash[0]) {
                testwindow.location.hash = urlSplitAtHash[1];
                testwindow.location.reload();
            } else {
                testwindow.location.href = url;
            }
        }
        return testwindow;
    }

    function requireReload() {
        get()[requireReloadFlag] = true;
    }

    function inReload() {
        return get() && get()[requireReloadFlag];
    }

    function ready() {
        return !!get() && !inReload();
    }

    return {
        get:get,
        requireReload:requireReload,
        ready:ready
    };

});