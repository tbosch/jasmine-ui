describe('describeUi', function () {
    describeUi("base functions", '/jasmine-ui/test/ui/jasmine-uiSpec.html', function () {
        it("should open the popup with the given url", function () {
            runs(function () {
                expect(window.location.pathname).toBe('/jasmine-ui/test/ui/jasmine-uiSpec.html');
            });
        });
        it("should execute it callbacks in the testwindow", function () {
            expect(window.opener.jasmineui).toBeTruthy();
        });
        it("should execute runs callbacks in the testwindow", function () {
            runs(function () {
                expect(window.opener.jasmineui).toBeTruthy();
            });
        });
        it("should execute waitFor callbacks in the testwindow", function () {
            var remoteJasmineui;
            waitsFor(function () {
                remoteJasmineui = window.opener.jasmineui;
                return true;
            });
            runs(function () {
                expect(remoteJasmineui).toBeTruthy();
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
            waitsForReload();
            runs(function() {
                expect(localCounter).toBe(0);
                expect(opener.remoteCounter).toBe(1);
            });

        });
    });

});