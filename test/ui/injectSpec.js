jasmineui.loadUi('/jasmine-ui/test/ui/jasmine-uiSpec.html', ['/jasmine-ui/test/ui/inject/sampleInjectedScript.js'], function () {
    describe('injected utilityScript execution in the client', function () {
        it("should execute utilityScript functions", function () {
            expect(sampleInjectedScript).toBe(true);
        });
    });
});

