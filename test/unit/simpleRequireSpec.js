describe('simpleRequire', function () {
    var oldModuleDefs;
    beforeEach(function () {
        jasmineui.require.cache = {};
        oldModuleDefs = jasmineui.define.moduleDefs;
        jasmineui.define.moduleDefs = [];
        document.documentElement.removeAttribute("data-jasmineui");
    });
    afterEach(function () {
        jasmineui.define.moduleDefs = oldModuleDefs;
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

        it('should merge objects under the "global" key into the globals module', function () {
            var globals = {};
            jasmineui.define('globals', function () {
                return globals;
            });
            jasmineui.define('a', function () {
                return {globals:{a:'a0'}};
            });
            jasmineui.define('b', function () {
                return {globals:{b:'b0', c:{c0:'c0'}}};
            });
            jasmineui.define('c', function () {
                return {globals:{c:{c1:'c1'}}};
            });
            jasmineui.require(['a', 'b', 'c']);
            expect(globals.a).toBe('a0');
            expect(globals.b).toBe('b0');
            expect(globals.c.c0).toBe('c0');
            expect(globals.c.c1).toBe('c1');
        });
    });
    describe('require.all', function () {
        it('should instantiate all modules matching the regex and return them', function () {
            var moduleA = 'a';
            var moduleB = 'b';
            jasmineui.define('a', function () {
                return moduleA;
            });
            jasmineui.define('b', function () {
                return moduleB;
            });
            var allModules;
            jasmineui.require.all(function (name) {
                return name === 'a';
            }, function (modules) {
                allModules = modules;
            });
            var moduleCount = 0;
            for (var x in allModules) {
                moduleCount++;
            }
            expect(moduleCount).toBe(1);
            expect(allModules.a).toBe(moduleA);
        });
    });
    describe('require.default', function () {
        var moduleA = 'a';
        var moduleB = 'b';
        var moduleC = 'c';
        var allModules;
        beforeEach(function () {
            jasmineui.define('a', function () {
                return moduleA;
            });
            jasmineui.define('client/b', function () {
                return moduleB;
            });
            jasmineui.define('server/c', function () {
                return moduleC;
            });
        });
        it('should ignore server modules in the client', function () {
            document.documentElement.setAttribute("data-jasmineui", "true");
            jasmineui.require.default(function (modules) {
                allModules = modules;
            });
            var prop;
            var count = 0;
            for (prop in allModules) {
                count++;
            }
            expect(count).toBe(2);
            expect(allModules['client/b']).toBe(moduleB);
        });
        it('should ignore client modules in the server', function () {
            document.documentElement.setAttribute("data-jasmineui", "");
            jasmineui.require.default(function (modules) {
                allModules = modules;
            });
            var prop;
            var count = 0;
            for (prop in allModules) {
                count++;
            }
            expect(count).toBe(2);
            expect(allModules['server/c']).toBe(moduleC);
        });
    });
});