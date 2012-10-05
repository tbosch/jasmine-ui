jasmineui.loadUi('/jasmine-ui/test/ui/jasmine-uiSpec.html#123', function () {
    describe('base functions', function () {
        var fixtureAddress = '/jasmine-ui/test/ui/jasmine-uiSpec.html';
        function currentBaseUrl() {
            return window.location.pathname;
        }

        it("should keep the hash in the url", function () {
            expect(location.hash).toBe('#123');
        });
        it("should execute it callbacks in the url defined by describeUi", function () {
            expect(currentBaseUrl()).toBe(fixtureAddress);
        });
        it("should execute runs callbacks in the url defined by describeUi", function () {
            runs(function () {
                expect(currentBaseUrl()).toBe(fixtureAddress);
            });
        });

        it("should execute waitFor callbacks in the url defined by describeUi", function () {
            var urlInWaitsFor;
            waitsFor(function () {
                urlInWaitsFor = currentBaseUrl();
                return true;
            });
            runs(function () {
                expect(urlInWaitsFor).toBe(fixtureAddress);
            });
        });
        it("should execute waits", function () {
            var startTime;
            runs(function () {
                startTime = new Date().getTime();
            });
            waits(1000);
            runs(function () {
                expect(new Date().getTime() - startTime).toBeGreaterThan(600);
            });
        });
        it("should allow access to default jasmine functions", function () {
            expect(spyOn).toBeTruthy();
            expect(jasmine).toBeDefined();
        });
    });
});
