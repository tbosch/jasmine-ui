(function () {
    var logEnabled = true;
    var waitsForAsyncTimeout = 5000;
    // Use popup mode only for jstestdriver.
    var popupMode = !!window.jstestdriver;

    jasmineui.require(['logger', 'simulateEvent'], function (logger, simulate) {
        logger.enabled(logEnabled);
        window.simulate = simulate;
    });

    if (jasmineui && jasmineui.persistent && jasmineui.persistent.currentSpec) {
        jasmineui.require(['describeUiClient', 'waitsForAsync'], function (describeUi, waitsForAsync) {
            window.xdescribeUi = window.xdescribe;

            window.describe = describeUi.describe;
            window.describeUi = describeUi.describeUi;
            window.beforeEach = describeUi.beforeEach;
            window.beforeLoad = describeUi.beforeLoad;
            window.runs = describeUi.runs;
            window.waitsFor = describeUi.waitsFor;
            window.waits = describeUi.waits;
            window.waitsForReload = describeUi.waitsForReload;
            waitsForAsync.setTimeout(waitsForAsyncTimeout);

            // Just call through.
            jasmineui.utilityScript = function (callback) {
                callback();
            };
        });
    } else {
        jasmineui.require(['describeUiServer'], function (describeUi) {
            if (popupMode) {
                describeUi.setPopupMode();
            } else {
                describeUi.setInplaceMode();
            }
            window.describeUi = describeUi.describeUi;
            window.it = describeUi.it;
            window.beforeLoad = function() {

            };
            window.describe = describeUi.describe;
            window.xdescribeUi = window.xdescribe;
            jasmineui.utilityScript = describeUi.utilityScript;

        });
    }
})();
