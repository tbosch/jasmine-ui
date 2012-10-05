/**
 * Simple implementation of AMD require/define assuming all
 * modules are named and loaded explicitly, and require is called
 * after all needed modules have been loaded.
 */
(function (window) {
    var ns = window.jasmineui = window.jasmineui || {};

    var define = function (name, deps, value) {
        var dotJs = name.indexOf('.js');
        if (dotJs !== -1) {
            name = name.substring(0, dotJs);
        }
        if (arguments.length == 2) {
            // No deps...
            value = deps;
            deps = [];
        }
        var conditionalSeparator = name.indexOf('?');
        if (conditionalSeparator !== -1) {
            var conditionName = name.substring(0, conditionalSeparator);
            var conditional = define.conditionals[conditionName];
            if (!conditional) {
                throw new Error("Unknown conditional: "+conditionName);
            }
            if (!conditional()) {
                return;
            }
            name = name.substring(conditionalSeparator + 1);
        }
        var def = {
            name:name,
            deps:deps,
            value:value
        };
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name == name) {
                define.moduleDefs[i] = def;
                return;
            }
        }
        define.moduleDefs.push(def);
    };
    define.moduleDefs = [];
    define.plugins = {
        factory:factoryPlugin
    };
    define.conditionals = {
        client: function() {
            return ns.clientMode;
        },
        server: function() {
            return !define.conditionals.client();
        }
    };

    function findModuleDefinition(name) {
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name == name) {
                return mod;
            }
        }
        throw new Error("Could not find the module " + name);
    }

    function plugin(pluginName, moduleName) {
        var p = define.plugins[pluginName];
        if (!p) {
            throw new Error("Unknown plugin " + pluginName);
        }
        return p(moduleName);
    }

    function factoryPlugin(moduleName) {
        return function (cache) {
            cache = cache || {};
            return factory(moduleName, cache);
        }
    }

    function factory(name, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        if (instanceCache[name] === undefined) {
            var resolvedValue;
            var pluginSeparator = name.indexOf('!');
            if (pluginSeparator !== -1) {
                var pluginName = name.substring(0, pluginSeparator);
                var moduleName = name.substring(pluginSeparator + 1);
                resolvedValue = plugin(pluginName, moduleName);
            } else {
                // Normal locally defined modules.
                var mod = findModuleDefinition(name);
                var resolvedDeps = listFactory(mod.deps, instanceCache);
                resolvedValue = mod.value;
                if (typeof mod.value === 'function') {
                    resolvedValue = mod.value.apply(window, resolvedDeps);
                }
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

    var require = function (deps, callback) {
        var resolvedDeps = listFactory(deps, require.cache);
        // Note: testing if typeof callback==="function" does not work
        // in IE9 from remote window (then everything is an object...)
        if (callback && callback.apply) {
            callback.apply(this, resolvedDeps);
        }
        return resolvedDeps;
    };

    require.all = function(callback) {
        for (var i = 0; i < define.moduleDefs.length; i++) {
            require([define.moduleDefs[i].name]);
        }
        callback && callback(require.cache);
    };

    require.cache = {};

    ns.require = require;
    ns.define = define;

})(window);
