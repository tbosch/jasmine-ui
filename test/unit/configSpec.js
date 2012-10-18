jasmineui.require(["factory!config"], function (configFactory) {
    describe("config", function () {
        var config, persistentDataAccessor, persistentData, scriptAccessor, globals;

        beforeEach(function () {
            globals = {};
            persistentData = {};
            persistentDataAccessor = function () {
                return persistentData;
            };
            scriptAccessor = {
                currentScriptUrl:jasmine.createSpy('currentScriptUrl')
            };
        });

        function createConfig() {
            config = configFactory({
                globals:globals,
                persistentData:persistentDataAccessor,
                scriptAccessor:scriptAccessor
            });
        }

        it('should use defaults if nothing else is specified', function () {
            scriptAccessor.currentScriptUrl.andReturn('jasmineui.js');
            createConfig();
            expect(config).toEqual({
                logEnabled:false,
                asyncSensors:['load', 'timeout', 'interval', 'xhr', '$animationComplete', '$transitionComplete'],
                waitsForAsyncTimeout:5000,
                loadMode:'inplace',
                closeTestWindow:true,
                scripts:[],
                // Default is the url of jasmine ui
                baseUrl:scriptAccessor.currentScriptUrl()
            });
        });

        it('should always add the "load" sensor to the asyncSensors', function() {
            globals.jasmineuiConfig = {
                asyncSensors: []
            };
            createConfig();
            expect(config.asyncSensors).toEqual(["load"]);

        });

        it('should merge values from globals.jasmineuiConfig', function() {
            globals.jasmineuiConfig = {
                baseUrl: 'someBase'
            };
            createConfig();
            expect(config.baseUrl).toBe('someBase');
            expect(config.waitsForAsyncTimeout).toBe(5000);
        });

        it('should merge values from persistentData', function() {
            persistentData.config = {
                baseUrl: 'someBase'
            };
            createConfig();
            expect(config.baseUrl).toBe('someBase');
            expect(config.waitsForAsyncTimeout).toBe(5000);
        });

        it('should save the object into persistentData', function() {
            createConfig();
            expect(persistentData.config).toBe(config);
        });

        it('should make the scripts urls absolute', function() {
            globals.jasmineuiConfig = {
                scripts: [
                    {position:'begin', url: 'someUrl'}
                ],
                baseUrl: '/base/'
            };
            createConfig();
            expect(config.scripts[0].url).toBe('/base/someUrl');
        });

    });
});
