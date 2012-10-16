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

        describe('parseUrl and serializeUrl', function () {
            it('should parse and serialize urls without query and hash', function () {
                var someUrl = 'http://someUrl';
                var actualUrl = urlLoader.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:undefined,
                    query:[  ]
                });
                expect(urlLoader.serializeUrl(actualUrl)).toEqual(someUrl);
            });
            it('should parse urls with hashes', function () {
                var someUrl = 'http://someUrl#123';
                var actualUrl = urlLoader.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:"123",
                    query:[  ]
                });
                expect(urlLoader.serializeUrl(actualUrl)).toBe(someUrl);
            });
            it('should parse urls with queries', function () {
                var someUrl = 'http://someUrl?a=b&c';
                var actualUrl = urlLoader.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:undefined,
                    query:[ "a=b", "c" ]
                });
                expect(urlLoader.serializeUrl(actualUrl)).toBe(someUrl);
            });
            it('should parse urls with queries and hashes', function () {
                var someUrl = 'http://someUrl?a=b&c#123';
                var actualUrl = urlLoader.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:'123',
                    query:[ "a=b", "c" ]
                });
                expect(urlLoader.serializeUrl(actualUrl)).toBe(someUrl);
            });
        });

        describe('setOrReplaceQueryAttr', function() {
            it('should add a new query attribute if not existing', function() {
                var data = {
                    query: []
                };
                urlLoader.setOrReplaceQueryAttr(data, 'someProp', 'someValue');
                expect(data.query).toEqual(["someProp=someValue"]);
            });
            it('should replace a query attribute if existing', function() {
                var data = {
                    query: ["a=b"]
                };
                urlLoader.setOrReplaceQueryAttr(data, 'a', 'c');
                expect(data.query).toEqual(["a=c"]);
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
