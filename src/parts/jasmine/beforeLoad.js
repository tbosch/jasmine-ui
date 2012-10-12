jasmineui.define('client?jasmine/beforeLoad', ['jasmine/original', 'persistentData', 'globals', 'jasmine/utils', 'instrumentor'], function (jasmineOriginal, persistentData, globals, jasmineUtils, instrumentor) {
    var pd = persistentData();

    if (pd.specIndex === -1) {
        globals.beforeLoad = function () {
            // Noop
        };
        return;
    }

    var remoteSpec = pd.specs[pd.specIndex];
    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        // Note: remoteSpec.id is not set yet for the first spec.
        var suiteId;
        var currentSuite = jasmine.getEnv().currentSuite;
        if (currentSuite) {
            suiteId = jasmineUtils.suiteId(currentSuite);
        }
        beforeLoadCallbacks.push({suiteId:suiteId, callback:callback});
    }

    instrumentor.endCall(function () {
        var specId = remoteSpec.id;
        var i, entry, suite;
        for (i = 0; i < beforeLoadCallbacks.length; i++) {
            entry = beforeLoadCallbacks[i];
            if (!entry.suiteId || specId.indexOf(entry.suiteId) === 0) {
                try {
                    entry.callback();
                } catch (e) {
                    var localSpec = jasmineUtils.findRemoteSpecLocally(specId);
                    localSpec.fail(e);
                }
            }
        }
    });

    globals.beforeLoad = beforeLoad;

    return {
        beforeLoad:beforeLoad
    }
});
