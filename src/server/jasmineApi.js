jasmineui.define('server/jasmineApi', ['globals'], function (globals) {

    function fail(message) {
        globals.jasmine.getEnv().currentSpec.fail(message);
    }

    /**
     * Save the original values, as we are overwriting them in some modules
     */
    return {
        beforeEach:globals.beforeEach,
        afterEach: globals.afterEach,
        describe:globals.describe,
        runs:globals.runs,
        it:globals.it,
        waitsFor:globals.waitsFor,
        waits:globals.waits,
        fail:fail
    }
});