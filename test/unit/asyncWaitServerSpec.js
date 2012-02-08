describe('server/asyncWaitServer', function () {
    var jasmineApi,clientInvoker, testwindow;
    var module, flags = {};
    beforeEach(function () {
        jasmineApi = {
            waits:jasmine.createSpy('waits'),
            runs:jasmine.createSpy('runs'),
            waitsFor:jasmine.createSpy('waitsFor')
        };
        clientInvoker = {
            isWaitForAsync:jasmine.createSpy('isWaitForAsync'),
            ready:jasmine.createSpy('ready')
        };
        module = require.factory('server/asyncWaitServer', {
            'server/jasmineApi':jasmineApi,
            'server/clientInvoker':clientInvoker
        });
    });
    it("should use waitsFor on the jasmineApi with the given timeout", function () {
        module.waitsForAsync(1234);
        expect(jasmineApi.waitsFor).toHaveBeenCalled();
        expect(jasmineApi.waitsFor.mostRecentCall.args[2]).toBe(1234);
    });
    it("should use a default timeout of 5000", function () {
        module.waitsForAsync();
        expect(jasmineApi.waitsFor).toHaveBeenCalled();
        expect(jasmineApi.waitsFor.mostRecentCall.args[2]).toBe(5000);
    });
    it("should wait for the the clientInvoker to be ready", function () {
        module.waitsForAsync();
        var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
        clientInvoker.ready.andReturn(false);
        expect(callback()).toBe(false);
        clientInvoker.ready.andReturn(true);
        expect(callback()).toBe(true);
    });

    it("should wait for isAsyncWait in the client", function () {
        module.waitsForAsync();
        var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
        clientInvoker.ready.andReturn(true);
        clientInvoker.isWaitForAsync.andReturn(true);
        expect(callback()).toBe(false);
        clientInvoker.isWaitForAsync.andReturn(false);
        expect(callback()).toBe(true);
    });
});