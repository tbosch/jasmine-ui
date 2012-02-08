/**
 * Simple implementation of AMD require/define assuming all
 * modules are named and loaded explicitly, and require is called
 * after all needed modules have been loaded.
 */
var require, define;
(function (window) {

    if (typeof define !== "undefined") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    var moduleDefs = [];

    define = function (name, deps, value) {
        var dotJs = name.indexOf('.js');
        if (dotJs !== -1) {
            name = name.substring(0, dotJs);
        }
        if (arguments.length == 2) {
            // No deps...
            value = deps;
            deps = [];
        }
        moduleDefs.push({
            name:name,
            deps:deps,
            value:value
        });
    };

    function findModuleDefinition(name) {
        for (var i = 0; i < moduleDefs.length; i++) {
            var mod = moduleDefs[i];
            if (mod.name == name) {
                return mod;
            }
        }
        throw new Error("Could not find the module " + name);
    }


    function factory(name, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        var mod = findModuleDefinition(name);
        if (!instanceCache[mod.name]) {
            var resolvedDeps = listFactory(mod.deps, instanceCache);
            var resolvedValue = mod.value;
            if (typeof mod.value === 'function') {
                resolvedValue = mod.value.apply(window, resolvedDeps);
            }
            instanceCache[name] = resolvedValue;
        }
        return instanceCache[name];
    }

    function listFactory(deps, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        var resolvedDeps = [];
        for (var i = 0; i < deps.length; i++) {
            resolvedDeps.push(factory(deps[i], instanceCache));
        }
        return resolvedDeps;
    }

    var instanceCache = {};

    require = function (deps, callback) {
        var resolvedDeps = listFactory(deps, instanceCache);
        if (typeof callback === 'function') {
            callback.apply(this, resolvedDeps);
        }
        return resolvedDeps;
    };

    require.factory = factory;

})(window);
