jasmineui.require(['factory!urlLoader'], function (urlLoaderFactory) {

    describe("urlLoader", function () {
        var urlLoader, persistentDataAccessor, persistentData;
        beforeEach(function () {
            persistentData = {};
            persistentDataAccessor = function() {
                return persistentData;
            };
            persistentDataAccessor.saveDataToWindow = jasmine.createSpy('saveDataToWindow');
            urlLoader = urlLoaderFactory({
                persistentData:persistentDataAccessor
            });
        });

        describe('navigateWithReloadTo', function() {
            it('should add a new query attribute', function() {
                var win = {
                    location : {}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(win.location.href).toBe('http://someUrl?juir=1');
                expect(persistentData.refreshCount).toBe(1);
            });
            it('should replace an existing query attribute', function() {
                persistentData.refreshCount = 2;
                var win = {
                    location : {}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(win.location.href).toBe('http://someUrl?juir=3');
                expect(persistentData.refreshCount).toBe(3);
            });
            it('should call persistentData.saveDataToWindow', function() {
                var win = {
                    location : {}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(persistentDataAccessor.saveDataToWindow).toHaveBeenCalledWith(win);
            });
        });

    });

});
