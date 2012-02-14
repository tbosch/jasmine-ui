jasmineui.require(['factory!client/waitsForReload'], function (waitsForReloadFactory) {
    describe('client/waitsForReload', function () {
        var waitsForReload, remoteSpecClient, waitsForAsync, reloadMarker;
        beforeEach(function () {
            remoteSpecClient = {
                runs:jasmine.createSpy('runs')
            };
            reloadMarker = {
                requireReload: jasmine.createSpy('requireReload')
            };
            waitsForAsync = jasmine.createSpy('waitsForAsync');
            waitsForReload = waitsForReloadFactory({
                'client/remoteSpecClient':remoteSpecClient,
                'client/waitsForAsync': waitsForAsync,
                'client/reloadMarker': reloadMarker
            });
        });
        it("should call requireReload in a runs statement", function () {
            remoteSpecClient.runs.andCallFake(function(callback) {
                callback();
            });
            waitsForReload();
            expect(reloadMarker.requireReload).toHaveBeenCalled();
        });
        it("should call waitsForAsync with the given timeout", function () {
            waitsForReload(1234);
            expect(waitsForAsync).toHaveBeenCalledWith(1234);
        });
    });
});
