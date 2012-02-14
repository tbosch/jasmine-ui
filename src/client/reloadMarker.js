jasmineui.define('client/reloadMarker', function () {
    var value = false;

    function inReload() {
        return value;
    }

    function requireReload() {
        value = true;
    }

    return {
        inReload:inReload,
        requireReload:requireReload
    }
});