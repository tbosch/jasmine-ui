describe('server/loadHtml', function () {
    var mod, testwindow, jasmineApi, scriptAccessor, clientInvoker, asyncWaitServer;

    beforeEach(function () {
        testwindow = {
            get:jasmine.createSpy('get')
        };
        jasmineApi = {
            runs:jasmine.createSpy('runs')
        };
        scriptAccessor = {
            findScripts:jasmine.createSpy('findScripts'),
            writeScriptWithUrl:jasmine.createSpy('writeScriptWithUrl'),
            writeInlineScript:jasmine.createSpy('writeInlineScript')
        };
        clientInvoker = {
            addBeforeLoadListener:jasmine.createSpy('addBeforeLoadListener')
        };
        asyncWaitServer = {
            waitsForAsync:jasmine.createSpy('waitsForAsync')
        };
        mod = require.factory('server/loadHtml', {
            'server/testwindow':testwindow,
            'server/jasmineApi':jasmineApi,
            'scriptAccessor':scriptAccessor,
            'server/clientInvoker':clientInvoker,
            'server/asyncWaitServer':asyncWaitServer
        });
    });

    it("should use runs and waitsForAsync", function () {
        mod.execute('someUrl');
        expect(jasmineApi.runs).toHaveBeenCalled();
        expect(asyncWaitServer.waitsForAsync).toHaveBeenCalled();
    });

    it("should create the instrument function", function () {
        mod.execute('someUrl');
        expect(window.instrument).toBeFalsy();
        jasmineApi.runs.argsForCall[0][0]();
        expect(window.instrument).toBeDefined();
    });

    it("should open the testwindow", function () {
        mod.execute('someUrl');
        jasmineApi.runs.argsForCall[0][0]();
        expect(testwindow.get).toHaveBeenCalledWith('someUrl');
    });

    it("should write the configured scripts to the new document", function () {
        mod.injectScripts(['jasmine-ui[^/]*$', 'UiSpec[^/]*$']);
        var scriptUrls = ['jasmine-ui-0.1.js', 'someUiSpec.js', 'someNormalSpec.js'];
        scriptAccessor.findScripts.andCallFake(function (doc, callback) {
            for (var i = 0; i < scriptUrls.length; i++) {
                callback(scriptUrls[i]);
            }
        });
        mod.execute('someUrl');
        jasmineApi.runs.argsForCall[0][0]();
        var someWindow = {location:{href:'someUrl'}};
        window.instrument(someWindow);
        expect(scriptAccessor.writeScriptWithUrl.callCount).toBe(2);
        expect(scriptAccessor.writeScriptWithUrl.argsForCall[0][1]).toBe(scriptUrls[0]);
        expect(scriptAccessor.writeScriptWithUrl.argsForCall[1][1]).toBe(scriptUrls[1]);
    });

    it("should install the beforeLoadListener", function () {
        var listener = jasmine.createSpy('listener');
        mod.execute('someUrl', listener);
        jasmineApi.runs.argsForCall[0][0]();
        var doc = {};
        var someWindow = {location:{href:'someUrl'}, document: doc};
        window.instrument(someWindow);
        expect(scriptAccessor.writeInlineScript).toHaveBeenCalledWith(doc, 'opener.afterScriptInjection();');
        expect(window.afterScriptInjection).toBeDefined();
        window.afterScriptInjection();
        expect(clientInvoker.addBeforeLoadListener).toHaveBeenCalledWith(listener);

    });
});