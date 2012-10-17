jasmineui.define('jasmine/client/waitsForAsync', ['client/asyncSensor', 'jasmine/original'], function (asyncSensor, jasmineOriginal) {
    /**
     * Waits for the end of all asynchronous actions.
     */
    function waitsForAsync() {
        var asyncProcessing = true;
        jasmineOriginal.runs(function () {
            asyncSensor.afterAsync(function() {
                asyncProcessing = false;
            });
        });
        jasmineOriginal.waitsFor(function() {
            return !asyncProcessing;
        });
    }

    function runs(callback) {
        waitsForAsync();
        jasmineOriginal.runs(callback);
    }

    return {
        waitsForAsync: waitsForAsync,
        runs: runs
    };
});