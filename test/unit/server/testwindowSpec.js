jasmineui.require(['factory!server/testwindow'], function (testwindowFactory) {
    describe('server/testwindow', function () {
        var testwindow, testScripts, serverwindow, clientwindow, globals;
        beforeEach(function () {
            clientwindow = {
                location:{
                    reload:jasmine.createSpy('reload')
                },
                document:{
                    writeln:jasmine.createSpy('writeln')
                }
            };
            serverwindow = {
                open:jasmine.createSpy('open').andReturn(clientwindow)
            };
            globals = {
                window:serverwindow,
                jasmineui:{
                    scriptUrl:'jasmineUiScriptUrl'
                }
            };
            testwindow = testwindowFactory({
                globals:globals
            });
            testScripts = [];
        });
        it("should open a new window with the given url", function () {
            var someUrl = '/someUrl';
            testwindow(someUrl, testScripts);
            expect(serverwindow.open).toHaveBeenCalledWith(someUrl, 'jasmineui');
        });
        it("should require absolute urls", function () {
            try {
                testwindow('someUrl', testScripts);
                expect(true).toBe(false);
            } catch (e) {
                // expected
            }
        });
        it("should return the existing window if called with no arguments", function () {
            expect(testwindow()).toBeFalsy();
            testwindow('/someUrl', testScripts);
            expect(testwindow()).toBe(clientwindow);
        });
        it("should call window.open only once", function () {
            testwindow('/someUrl', testScripts);
            testwindow('/someUrl2', testScripts);
            expect(serverwindow.open.callCount).toBe(1);
            expect(serverwindow.open.mostRecentCall.args[0]).toBe('/someUrl');
        });

        it("should reload the testwindow by assigning location.href if the path differs even on first call", function () {
            clientwindow.jasmineui = {};
            testwindow('/someUrl2', testScripts);
            expect(clientwindow.location.href).toBe('/someUrl2');
            expect(clientwindow.location.reload).not.toHaveBeenCalled();
        });
        it("should reload the testwindow by calling location.reload if only the hash changed even on first call", function () {
            clientwindow.jasmineui = {};
            clientwindow.location.pathname = '/someUrl';
            testwindow('/someUrl#12', testScripts);
            expect(clientwindow.location.href).toBeUndefined();
            expect(clientwindow.location.hash).toBe('12');
            expect(clientwindow.location.reload).toHaveBeenCalled();
        });
        describe('window instrumentation', function () {
            it("should create an instrument function in the calling window", function () {
                testwindow('/someUrl', testScripts);
                expect(globals.instrument).toBeDefined();
            });
            it("should add the jasmineui script to the new window", function () {
                testwindow('/someUrl', testScripts);
                globals.instrument(clientwindow);
                var w = clientwindow.document.writeln;
                expect(w.callCount).toBe(1);
                expect(w.argsForCall[0][0]).toBe('<script type="text/javascript" src="' + globals.jasmineui.scriptUrl + '"></script>');
            });
            it("should add callback to itself which will add the scripts given as parameter", function () {
                testScripts = ['someScriptUrl1'];
                testwindow('/someUrl', testScripts);
                globals.instrument(clientwindow);
                testwindow.afterJasmineUiInjection();
                var w = clientwindow.document.writeln;
                expect(w.callCount).toBe(2);
                expect(w.argsForCall[1][0]).toBe('<script type="text/javascript" src="' + testScripts[0] + '"></script>');
            });
        });
    });
});