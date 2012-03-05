jasmineui.define('loadUrl', function () {

    function splitAtHash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos != -1) {
            return [url.substring(0, hashPos), url.substring(hashPos + 1)];
        } else {
            return [url, ''];
        }
    }

    /**
     * Sets the given url in the given window. Ensures that the window does a reload.
     */
    function loadUrl(window, url) {
        if (url.charAt(0) !== '/') {
            // We need absolute paths because of the check later with location.pathname.
            throw new Error("Absolute paths are required");
        }
        var oldPath = window.location.pathname;
        // if only the hash changes, the
        // page will not reload by assigning the href but only
        // change the hashpath.
        // So detect this and do a manual reload.
        var urlSplitAtHash = splitAtHash(url);
        if (oldPath === urlSplitAtHash[0]) {
            window.location.hash = urlSplitAtHash[1];
            window.location.reload();
        } else {
            window.location.href = url;
        }
        return window;
    }

    return loadUrl;
});