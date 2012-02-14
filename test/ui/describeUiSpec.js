describe('describeUi', function () {
    describeUi("base functions", '/jasmine-ui/test/ui/jasmine-uiSpec.html', function () {
        it("should open the popup with the given url", function () {
            runs(function () {
                expect(window.location.pathname).toBe('/jasmine-ui/test/ui/jasmine-uiSpec.html');
            });
        });
        it("should execute it callbacks in the testwindow", function () {
            expect(window.opener).toBeTruthy();
        });
        it("should execute runs callbacks in the testwindow", function () {
            runs(function () {
                expect(window.opener).toBeTruthy();
            });
        });
        it("should execute waitFor callbacks in the testwindow", function () {
            var openerInWaitsFor;
            waitsFor(function () {
                openerInWaitsFor = window.opener;
                return true;
            });
            runs(function () {
                expect(openerInWaitsFor).toBeTruthy();
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
        it("should allow access to default jasmine functions", function() {
            expect(spyOn).toBeTruthy();
            expect(jasmine).toBeTruthy();
        });
        xit("should be able to use xit", function () {
            expect(true).toBe(false);
        });
    });
    xdescribe('should be able to use xdescribe', function () {
        it("should not run", function () {
            expect(true).toBe(false);
        })
    });

    xdescribeUi('should be able to use xdescribeUi', 'somePage', function () {
        it("should not run", function () {
            expect(true).toBe(false);
        })
    });

    describe('describe interactions', function() {
        var describeCount = 0;
        var callcount = 0;
        describeUi("describe1", '/jasmine-ui/test/ui/jasmine-uiSpec.html', function() {
            describeCount++;
            it("should only call one describe in a window 1", function() {
                expect(describeCount).toBe(1);
                expect(callcount).toBe(0);
                callcount++;
            });
            it("should only call one describe in a window 2", function() {
                expect(callcount).toBe(0);
                callcount++;
            });
        });
        describeUi("describe2", '/jasmine-ui/test/ui/jasmine-uiSpec.html', function() {
            describeCount++;
            it("should only call one describe in a window 1", function() {
                expect(callcount).toBe(0);
                expect(describeCount).toBe(1);
            });
        });
    });

    describeUi("hook functions, even in incorrect order", '/jasmine-ui/test/ui/jasmine-uiSpec.html', function () {
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
            expect($).toBeDefined();
            expect($.isReady).toBe(false);
        });
        it("should execute the hook functions in the right order", function () {
            runs(function () {
                expect(state).toBe(3);
                expect($.isReady).toBe(true);

                state++;
            });
        });
    });

    describeUi("repeating hooks", '/jasmine-ui/test/ui/jasmine-uiSpec.html', function() {
        var called1, called2;
        beforeEach(function() {
            called1 = true;
            runs(function() {
                called2 = true;
            });
        });
        it("should call beforeEach for every it 1", function() {
            expect(called1).toBe(true);
            expect(called2).toBe(true);
        });
        it("should call beforeEach for every it 2", function() {
            expect(called1).toBe(true);
            expect(called2).toBe(true);
        });
    });

    describeUi('multi page handling', '/jasmine-ui/test/ui/jasmine-uiSpec.html', function () {
        var localCounter = 0;
        it("should be able to continue executing after a page reload, however by loosing state", function() {
            runs(function() {
                localCounter++;
                if (opener.remoteCounter === undefined) {
                    opener.remoteCounter = 0;
                }
                opener.remoteCounter++;
                location.reload();
            });
            waitsForAsync({requireReload: true});
            runs(function() {
                expect($).toBeDefined();
                expect(localCounter).toBe(0);
                expect(opener.remoteCounter).toBe(1);
            });

        });
    });

});