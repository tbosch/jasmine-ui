define('server/describeUi', ['server/jasmineApi', 'server/loadHtml', 'server/testwindow', 'server/asyncWaitServer'], function (jasmineApi, loadHtml, testwindow, asyncWait) {

    var currentBeforeLoadCallbacks;

    /**
     * Just like describe, but opens a window with the given url during the test.
     * Also needed for beforeLoad to work.
     * @param name
     * @param pageUrl
     * @param callback
     */
    function describeUi(name, pageUrl, callback) {
        function execute() {
            var beforeLoadCallbacks = [];
            jasmineApi.beforeEach(function () {
                jasmineApi.runs(function () {
                    loadHtml.execute(pageUrl, function () {
                        for (var i = 0; i < beforeLoadCallbacks.length; i++) {
                            beforeLoadCallbacks[i]();
                        }
                    });
                });

            });
            var oldCallbacks = currentBeforeLoadCallbacks;
            currentBeforeLoadCallbacks = beforeLoadCallbacks;
            callback();
            currentBeforeLoadCallbacks = oldCallbacks;
        }

        jasmineApi.describe(name, execute);
    }

    /**
     * Registers a callback that will be called right before the page loads
     * @param callback
     */
    function beforeLoad(callback) {
        if (!currentBeforeLoadCallbacks) {
            throw new Error("beforeLoad must be called inside of a describeUi statement!");
        }
        currentBeforeLoadCallbacks.push(callback);
    }

    return {
        describeUi:describeUi,
        beforeLoad:beforeLoad
    }
});