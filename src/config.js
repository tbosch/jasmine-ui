jasmineui.define('config', ['globals', 'persistentData'], function (globals, persistentData) {
    var popupMode = !!globals.jstestdriver;
    var pd = persistentData();
    var clientMode = pd.specs && pd.specIndex < pd.specs.length;

    return {
        logEnabled:false,
        waitsForAsyncTimeout:5000,
        popupMode:popupMode,
        clientMode:clientMode
    }
});