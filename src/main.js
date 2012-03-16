(function () {



    jasmineui.require(['simulateEvent'], function (simulate) {
        window.simulate = simulate;
    });

    var config;
    jasmineui.require(['config'], function(_config) {
        config = _config;
    });
    if (config.clientMode) {
        jasmineui.require(['describeUiClient'], function (describeUi) {
            window.xdescribeUi = window.xdescribe;
            window.describe = describeUi.describe;
            window.describeUi = describeUi.describeUi;
            window.beforeLoad = describeUi.beforeLoad;
            window.runs = describeUi.runs;
            window.waitsFor = describeUi.waitsFor;
            window.waits = describeUi.waits;
            jasmineui.utilityScript = describeUi.utilityScript;
        });
    } else {
        jasmineui.require(['describeUiServer'], function (describeUi) {
            window.describeUi = describeUi.describeUi;
            window.it = describeUi.it;
            window.beforeLoad = describeUi.beforeLoad;
            window.describe = describeUi.describe;
            window.xdescribeUi = window.xdescribe;
            jasmineui.utilityScript = describeUi.utilityScript;

        });
    }
})();
