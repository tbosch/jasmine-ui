jasmineui.define('client?jasmine/beforeLoad', ['jasmine/original', 'persistentData', 'loadListener', 'globals', 'jasmine/utils'], function (jasmineOriginal, persistentData, loadListener, globals, jasmineUtils) {
    // TODO move this to a utils.js
    var remoteSpec = persistentData().specs[persistentData().specIndex];

    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        beforeLoadCallbacks.push(callback);
    }

    loadListener.addBeforeLoadListener(function () {
        // TODO only execute those beforeLoad callbacks that belong
        // to a suite of the currently executing spec.
        var localSpec = jasmineUtils.findRemoteSpecLocally(remoteSpec.id);
        for (var i = 0; i < beforeLoadCallbacks.length; i++) {
            try {
                beforeLoadCallbacks[i]();
            } catch (e) {
                localSpec.fail(e);
            }
        }
    });

    globals.beforeLoad = beforeLoad;

    return {
        beforeLoad: beforeLoad
    }
});
