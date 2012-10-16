jasmineui.define('client?beforeLoad', ['persistentData', 'globals', 'instrumentor', 'loadUi'], function (persistentData, globals, instrumentor, loadUi) {
    var pd = persistentData();

    if (pd.specIndex === -1) {
        globals.jasmineui.beforeLoad = function () {
            // Noop
        };
        return;
    }

    var remoteSpec = pd.specs[pd.specIndex];
    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        beforeLoadCallbacks.push(callback);
    }

    instrumentor.endCall(function () {
        var i;
        for (i = 0; i < beforeLoadCallbacks.length; i++) {
            try {
                beforeLoadCallbacks[i]();
            } catch (e) {
                loadUi.reportError(e);
            }
        }
    });

    globals.jasmineui.beforeLoad = beforeLoad;

    return {
        beforeLoad:beforeLoad
    }
});
