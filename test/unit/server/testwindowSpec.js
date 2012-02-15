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
                window:serverwindow
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
            testwindow(someUrl, [], callback);
            expect(serverwindow.open).toHaveBeenCalledWith(someUrl, 'jasmineui');
        });
        it("should require absolute urls", function () {
            try {
                testwindow('someUrl', [], callback);
                expect(true).toBe(false);
            } catch (e) {
                // expected
            }
        });
        it("should return the existing window if called with no arguments", function () {
            expect(testwindow()).toBeFalsy();
            testwindow('/someUrl', [], callback);
            expect(testwindow()).toBe(clientwindow);
        });
        it("should save the new window into the remote plugin", function () {
            var someUrl = '/someUrl';
            testwindow(someUrl, [], callback);
            expect(remotePluginSetWindow).toHaveBeenCalledWith(clientwindow);
        });
        it("should mark the testwindow for reload if it was already open", function () {
            testwindow('/someUrl', [], callback);
            expect(reloadMarkerRemote).not.toHaveBeenCalled();
            testwindow('/someUrl2', [], callback);
            expect(reloadMarkerRemote).toHaveBeenCalledWith(clientwindow);
            expect(reloadMarker.requireReload).toHaveBeenCalled();
        });
        it("should reload the testwindow by assigning location.href if the path differes", function () {
            testwindow('/someUrl', [], callback);
            testwindow('/someUrl2', [], callback);
            expect(clientwindow.location.href).toBe('/someUrl2');
            expect(clientwindow.location.reload).not.toHaveBeenCalled();
        });
        it("should reload the testwindow by calling location.reload if only the hash changed", function () {
            testwindow('/someUrl', [], callback);
            clientwindow.location.pathname = '/someUrl';
            testwindow('/someUrl#12', [], callback);
            expect(clientwindow.location.href).toBeUndefined();
            expect(clientwindow.location.hash).toBe('12');
            expect(clientwindow.location.reload).toHaveBeenCalled();
        });
        describe('window instrumentation', function () {
            it("should create an instrument function in the calling window", function () {
                testwindow('/someUrl', [], callback);
                expect(globals.instrument).toBeDefined();
            });
            it("should add the given script urls to the new window", function () {
                var someScriptUrl = 'someScriptUrl';
                testwindow('/someUrl', [someScriptUrl], callback);
                globals.instrument(clientwindow);
                var w = clientwindow.document.writeln;
                expect(w.callCount).toBe(2);
                expect(w.argsForCall[0][0]).toBe('<script type="text/javascript" src="someScriptUrl"></script>');
                expect(w.argsForCall[1][0].substring(0, 40)).toBe('<script type="text/javascript">(function');
            });
            it("should add an extra script to call the given callback after the scripts", function () {
                var someScriptUrl = 'someScriptUrl';
                testwindow('/someUrl', [someScriptUrl], callback);
                globals.instrument(clientwindow);
                var w = clientwindow.document.writeln;
                expect(w.callCount).toBe(2);
                expect(w.argsForCall[1][0].substring(0, 40)).toBe('<script type="text/javascript">(function');
                expect(callback).not.toHaveBeenCalled();
                testwindow.afterScriptInjection();
                expect(callback).toHaveBeenCalled();
            });
        });
    });
});