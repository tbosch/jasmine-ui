jasmineui.require(['factory!server/waitsForAsync'], function (waitsForAsyncFactory) {
    describe('server/waitsForAsync', function () {
        var waitsForAsync, jasmineApi, asyncSensor, testwindow;
        beforeEach(function () {
            jasmineApi = {
                runs:jasmine.createSpy('runs'),
                waitsFor:jasmine.createSpy('waitsFor'),
                waits:jasmine.createSpy('waits')
            };
            testwindow = jasmine.createSpy('testwindow').andReturn({
                document:{ readyState:"complete"},
                jasmineui:{}
            });
            asyncSensor = jasmine.createSpy('asyncSensor');
            waitsForAsync = waitsForAsyncFactory({
                'server/jasmineApi':jasmineApi,
                'remote!client/asyncSensor':jasmine.createSpy().andReturn(asyncSensor),
                'server/testwindow':testwindow
            });
        });
        it("should use waitsFor on the jasmineApi with the given timeout", function () {
            waitsForAsync(1234);
            expect(jasmineApi.waitsFor).toHaveBeenCalled();
            expect(jasmineApi.waitsFor.mostRecentCall.args[2]).toBe(1234);
        });
        it("should use a default timeout of 5000", function () {
            waitsForAsync();
            expect(jasmineApi.waitsFor).toHaveBeenCalled();
            expect(jasmineApi.waitsFor.mostRecentCall.args[2]).toBe(5000);
        });
        it("should wait for testwindow document.readyState=complete", function () {
            waitsForAsync();
            var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
            testwindow().document.readyState = 'notReady';
            expect(callback()).toBe(false);
            testwindow().document.readyState = 'complete';
            expect(callback()).toBe(true);
        });
        it("should wait for jasmineui namespace in the testwindow", function () {
            waitsForAsync();
            var callback = jasmineApi.waitsFor.mostRecentCall.args[0];
            testwindow().jasmineui = undefined;
            expect(callback()).toBe(false);
            testwindow().jasmineui = {};
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
