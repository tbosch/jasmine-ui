describe('simpleRequire', function () {
    beforeEach(function () {
        jasmineui.require.cache = {};
    });

    describe('factory plugin', function () {
        it('should create accessor functions', function () {
            jasmineui.define('someModule', {});
            var someModuleFactory;
            jasmineui.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            expect(typeof someModuleFactory).toBe('function');
        });
        it("should create a new module instance on each call of the factory function", function () {
            var counter = 0;
            jasmineui.define('someModule', function () {
                return counter++;
            });
            var someModuleFactory;
            jasmineui.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            expect(someModuleFactory()).toBe(0);
            expect(someModuleFactory()).toBe(1);
        });
        it("should cache module instances using the given parameter", function () {
            var counter = 0;
            var cache = {};
            jasmineui.define('someModule', function () {
                return counter++;
            });
            var someModuleFactory;
            jasmineui.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            expect(someModuleFactory(cache)).toBe(0);
            expect(someModuleFactory(cache)).toBe(0);
        });
        it("should use the modules from the given cache", function () {
            jasmineui.define('someModule', 'someOtherValue');
            var someModuleFactory;
            jasmineui.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            var someValue = 'someValue';
            var cache = {someModule:someValue};
            expect(someModuleFactory(cache)).toBe(someValue);
        });
    });

    describe('require', function () {
        it('should cache created instances', function () {
            var counter = 0;
            jasmineui.define('someModule', function () {
                return counter++;
            });
            var actualValue1, actualValue2;
            jasmineui.require(['someModule'], function (someModule) {
                actualValue1 = someModule;
            });
            jasmineui.require(['someModule'], function (someModule) {
                actualValue2 = someModule;
            });
            expect(actualValue1).toBe(0);
            expect(actualValue2).toBe(0);
            expect(counter).toBe(1);
        });

        it('should create instances of fixed value modules', function () {
            var someValue = {};
            jasmineui.define('someModule', someValue);
            var actualValue;
            jasmineui.require(['someModule'], function (someModule) {
                actualValue = someModule;
            });
            expect(actualValue).toBe(someValue);
        });

        it('should create instances of modules with factory function', function () {
            var someValue = {};
            jasmineui.define('someModule', function () {
                return someValue;
            });
            var actualValue;
            jasmineui.require(['someModule'], function (someModule) {
                actualValue = someModule;
            });
            expect(actualValue).toBe(someValue);
        });

        it('should create dependent modules and inject them', function () {
            var someValue = {};
            jasmineui.define('someModule', function () {
                return someValue;
            });
            var actualValue;
            jasmineui.define('someModule2', ['someModule'], function (someModule) {
                actualValue = someModule;
            });
            jasmineui.require(['someModule2']);
            expect(actualValue).toBe(someValue);
        });
    });
});