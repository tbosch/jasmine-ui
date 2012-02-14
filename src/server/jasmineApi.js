jasmineui.define('server/jasmineApi', function () {

    function fail(message) {
        jasmine.getEnv().currentSpec.fail(message);
    }

    /**
     * Save the original values, as we are overwriting them in some modules
     */
    return {
        beforeEach:window.beforeEach,
        afterEach: window.afterEach,
        describe:window.describe,
        runs:window.runs,
        it:window.it,
        waitsFor:window.waitsFor,
        waits:window.waits,
        fail:fail
    }
});