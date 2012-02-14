jasmineui.require(['factory!client/waitsForAsync'], function (waitsForAsyncFactory) {
    describe('client/waitsForAsync', function () {
        var waitsForAsync, remoteSpecClient, asyncSensor;
        beforeEach(function () {
            remoteSpecClient = {
                runs:jasmine.createSpy('runs'),
                waitsFor:jasmine.createSpy('waitsFor'),
                waits:jasmine.createSpy('waits')
            };
            asyncSensor = jasmine.createSpy('asyncSensor');
            waitsForAsync = waitsForAsyncFactory({
                'client/remoteSpecClient':remoteSpecClient,
                'client/asyncSensor': asyncSensor
            });
        });
        it("should use waitsFor on the remoteSpecClient with the given timeout", function () {
            waitsForAsync(1234);
            expect(remoteSpecClient.waitsFor).toHaveBeenCalled();
            expect(remoteSpecClient.waitsFor.mostRecentCall.args[2]).toBe(1234);
        });
        it("should use a default timeout of 5000", function () {
            waitsForAsync();
            expect(remoteSpecClient.waitsFor).toHaveBeenCalled();
            expect(remoteSpecClient.waitsFor.mostRecentCall.args[2]).toBe(5000);
        });
        it("should wait for asyncSensor to return true", function () {
            waitsForAsync();
            var callback = remoteSpecClient.waitsFor.mostRecentCall.args[0];
            asyncSensor.andReturn(true);
            expect(callback()).toBe(false);
            asyncSensor.andReturn(false);
            expect(callback()).toBe(true);
        });
    });
});
