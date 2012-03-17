// See sampleInjectedCallback.js and sampleInjectedScript.js

describe('jasmineui.inject', function() {
    describeUi('utilityScript execution in the client', '/jasmine-ui/test/ui/jasmine-uiSpec.html', function () {
        it("should execute utilityScript functions", function () {
            expect(sampleInjectedCallbackCalled).toBe(true);
            expect(sampleInjectedScript).toBe(true);
        });
    });

    describe('utilityScript execution on the server', function () {
        it("should not execute utilityScript functions", function () {
            expect(sampleInjectedCallbackCalled).toBe(false);
            expect(typeof sampleInjectedScript).toBe("undefined");
        });
    });
});