jasmineui.require(['factory!server/waitsForAsync'], function (waitsForAsyncFactory) {
    describe('server/waitsForAsync', function () {
        var waitsForAsync, jasmineApi, asyncSensor, remotePlugin;
        beforeEach(function () {
            jasmineApi = {
                runs:jasmine.createSpy('runs'),
                waitsFor:jasmine.createSpy('waitsFor'),
                waits:jasmine.createSpy('waits')
            };
            var win = {
                document:{ readyState:"complete"},
                jasmineui:{}
            };
            remotePlugin = {
                getWindow:jasmine.createSpy('remotePlugin').andReturn(win)
            };
            asyncSensor = jasmine.createSpy('asyncSensor');
            waitsForAsync = waitsForAsyncFactory({
                'server/jasmineApi':jasmineApi,
                'remote!client/asyncSensor':jasmine.createSpy().andReturn(asyncSensor),
                'remote!':remotePlugin
            });
        });
        it("should use waitsFor on the jasmineApi with the given timeout", function () {
            waitsForAsync.setTimeout(1234);
            waitsForAsync();
            expect(jasmineApi.waitsFor).toHaveBeenCalled();
            expect(jasmineApi.waitsFor.mostRecentCall.args[2]).toBe(1234);
        });
        it("should use a default timeout of 5000", function () {
            waitsForAsync();
            expect(jasmineApi.waitsFor).toHaveBeenCalled();
            expect(jasmineApi.waitsFor.mostRecentCall.args[2]).toBe(5000);
        });
        it("should wait for remotePlugin document.readyState=complete", function () {
            waitsForAsync();
            var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
            remotePlugin.getWindow().document.readyState = 'notReady';
            expect(callback()).toBe(false);
            remotePlugin.getWindow().document.readyState = 'complete';
            expect(callback()).toBe(true);
        });
        it("should wait for jasmineui namespace in the remotePlugin", function () {
            waitsForAsync();
            var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
            remotePlugin.getWindow().jasmineui = undefined;
            expect(callback()).toBe(false);
            remotePlugin.getWindow().jasmineui = {};
            expect(callback()).toBe(true);
        });
        it("should wait for asyncSensor to return true", function () {
            waitsForAsync();
            var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
            asyncSensor.andReturn(true);
            expect(callback()).toBe(false);
            asyncSensor.andReturn(false);
            expect(callback()).toBe(true);
        });
    });
});
