jasmineui.require(['factory!client/reloadMarker'], function (reloadMarkerFactory) {
    describe('client/reloadMarker', function () {
        var reloadMarker;
        beforeEach(function () {
            reloadMarker = reloadMarkerFactory();
        });
        it('should return false by default', function () {
            expect(reloadMarker.inReload()).toBe(false);
        });

        it('should return true if reload is required', function () {
            reloadMarker.requireReload();
            expect(reloadMarker.inReload()).toBe(true);
        });
    });
});
