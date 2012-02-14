jasmineui.define('client/waitsForReload', ['client/remoteSpecClient', 'client/waitsForAsync', 'client/reloadMarker'], function (remoteSpecClient, waitsForAsync, reloadMarker) {
    function waitsForReload(timeout) {
        remoteSpecClient.runs(function () {
            reloadMarker.requireReload();
        });
        waitsForAsync(timeout);
    }

    return waitsForReload;
});