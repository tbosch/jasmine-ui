describe('describeUi', function () {
    var fixtureAddress =  '/jasmine-ui/test/ui/jasmine-uiSpec.html';

    describeUi("base functions", fixtureAddress, function () {
        function currentBaseUrl() {
            return window.location.pathname;
        }

        it("should open the popup with the given url", function () {
            runs(function () {
                expect(currentBaseUrl()).toBe(fixtureAddress);
            });
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
    describeUi("hook functions, even in incorrect order", fixtureAddress, function () {
        var state = 0;
        afterEach(function () {
            expect(state).toBe(4);
            state++;
            runs(function () {
                expect(state).toBe(5);
            });
        });
        beforeEach(function () {
            expect(state).toBe(1);
            state++;
            runs(function () {
                expect(state).toBe(2);
                state++;
            });
        });
        beforeLoad(function () {
            expect(state).toBe(0);
            state++;
            expect(document.readyState).not.toBe("complete");
        });
        it("should execute the hook functions in the right order", function () {
            runs(function () {
                expect(state).toBe(3);
                expect(document.readyState).toBe("complete");

                state++;
            });
        });
    });

    describeUi("repeating hooks", fixtureAddress, function () {
        var called1, called2;
        beforeEach(function () {
            called1 = true;
            runs(function () {
                called2 = true;
            });
        });
        it("should call beforeEach for every it 1", function () {
            expect(called1).toBe(true);
            expect(called2).toBe(true);
        });
        it("should call beforeEach for every it 2", function () {
            expect(called1).toBe(true);
            expect(called2).toBe(true);
        });
    });

    describeUi('multi page handling', fixtureAddress, function () {
        it("should be able to continue executing after a page reload, however by loosing state", function () {
            var localCounter = 0;
            runs(function () {
                localCounter++;
                jasmineui.persistent.multiPageFlag = 1;
                location.href = fixtureAddress+'?test=1';
            });
            runs(function () {
                expect(document.readyState).toBe("complete");
                expect(localCounter).toBe(0);
                expect(jasmineui.persistent.multiPageFlag).toBe(1);
                jasmineui.persistent.multiPageFlag = 2;
            });
        });
        it("check results", function() {
            expect(jasmineui.persistent.multiPageFlag).toBe(2);
        });
        it("should handle navigation by clicks to links correctly", function () {
            var localCounter = 0;
            runs(function () {
                localCounter++;
                jasmineui.persistent.multiPageFlag = 1;
                var link = document.createElement('a');
                link.href= fixtureAddress+'?test=1';
                document.body.appendChild(link);
                simulate(link, 'click');
            });
            runs(function () {
                expect(document.readyState).toBe("complete");
                expect(localCounter).toBe(0);
                expect(jasmineui.persistent.multiPageFlag).toBe(1);
                jasmineui.persistent.multiPageFlag = 2;
            });
        });
        it("check results", function() {
            expect(jasmineui.persistent.multiPageFlag).toBe(2);
        });
    });

    describeUi('utilityScript execution in the client', fixtureAddress, function () {
        it("should execute utilityScript functions", function () {
            expect(utilityScriptCalled).toBe(true);
        });
    });

    describe('utilityScript execution on the server', function () {
        it("should not execute utilityScript functions", function () {
            expect(utilityScriptCalled).toBe(false);
        });
    });

    describe("normal specs", function() {
        it("should execute them", function() {
            expect(1).toBe(1);
        });
    });
});