jasmineui.require(['factory!server/testwindow'], function (testwindowFactory) {
    describe('server/testwindow', function () {
        var testwindow, callback, serverwindow, clientwindow, reloadMarkerRemote, reloadMarkerRemote, reloadMarker, globals, remotePluginSetWindow;
        beforeEach(function () {
            reloadMarker = {
                requireReload:jasmine.createSpy('reloadMarker')
            };
            reloadMarkerRemote = jasmine.createSpy('reloadMarkerRemote').andReturn(reloadMarker);
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
            remotePluginSetWindow = jasmine.createSpy('remotePluginSetWindow');
            testwindow = testwindowFactory({
                globals:globals,
                'remote!client/reloadMarker':reloadMarkerRemote,
                'remote!':{
                    setWindow:remotePluginSetWindow
                }
            });
            callback = jasmine.createSpy('callback');
        });
        it("should open a new window with the given url", function () {
            var someUrl = '/someUrl';
            testwindow(someUrl, callback);
            expect(serverwindow.open).toHaveBeenCalledWith(someUrl, 'jasmineui');
        });
        it("should require absolute urls", function () {
            try {
                testwindow('someUrl', callback);
                expect(true).toBe(false);
            } catch (e) {
                // expected
            }
        });
        it("should return the existing window if called with no arguments", function () {
            expect(testwindow()).toBeFalsy();
            testwindow('/someUrl', callback);
            expect(testwindow()).toBe(clientwindow);
        });
        it("should save the new window into the remote plugin", function () {
            var someUrl = '/someUrl';
            testwindow(someUrl, callback);
            expect(remotePluginSetWindow).toHaveBeenCalledWith(clientwindow);
        });
        it("should call window.open only once", function () {
            testwindow('/someUrl', callback);
            testwindow('/someUrl2', callback);
            expect(serverwindow.open.callCount).toBe(1);
            expect(serverwindow.open.mostRecentCall.args[0]).toBe('/someUrl');
        });

        it("should mark the testwindow for reload if it contained jasmineui artifacts", function () {
            clientwindow.jasmineui = {};
            testwindow('/someUrl', callback);
            expect(reloadMarkerRemote).toHaveBeenCalledWith(clientwindow);
            expect(reloadMarker.requireReload).toHaveBeenCalled();
        });
        it("should reload the testwindow by assigning location.href if the path differs even on first call", function () {
            clientwindow.jasmineui = {};
            testwindow('/someUrl2', callback);
            expect(clientwindow.location.href).toBe('/someUrl2');
            expect(clientwindow.location.reload).not.toHaveBeenCalled();
        });
        it("should reload the testwindow by calling location.reload if only the hash changed even on first call", function () {
            clientwindow.jasmineui = {};
            clientwindow.location.pathname = '/someUrl';
            testwindow('/someUrl#12', callback);
            expect(clientwindow.location.href).toBeUndefined();
            expect(clientwindow.location.hash).toBe('12');
            expect(clientwindow.location.reload).toHaveBeenCalled();
        });
        describe('window instrumentation', function () {
            it("should create an instrument function in the calling window", function () {
                testwindow('/someUrl', callback);
                expect(globals.instrument).toBeDefined();
            });
            it("should add the jasmineui script to the new window", function () {
                testwindow('/someUrl', callback);
                globals.instrument(clientwindow);
                var w = clientwindow.document.writeln;
                expect(w.callCount).toBe(1);
                expect(w.argsForCall[0][0]).toBe('<script type="text/javascript" src="' + globals.jasmineui.scriptUrl + '"></script>');
            });
            it("should add callback to itself which will trigger the given callback", function () {
                testwindow('/someUrl', callback);
                globals.instrument(clientwindow);
                expect(callback).not.toHaveBeenCalled();
                testwindow.afterJasmineUiInjection();
                expect(callback).toHaveBeenCalledWith(clientwindow);
            });
        });
    });
});