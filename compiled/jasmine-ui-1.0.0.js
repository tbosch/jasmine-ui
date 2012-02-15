/**
 * Defines the modules of jasmine-ui.
 * Will also be used by the build command to append all files into
 * one file.
 * @param src
 */
(function () {
    function script(url) {
        document.write('<script type="text/javascript" src="/jasmine-ui/src/' + url + '"></script>');
    }


















    function scriptLoadListener(event) {
        if (event.target.nodeName === 'SCRIPT') {
            document.removeEventListener('load', scriptLoadListener, true);
            window.jasmineui = window.jasmineui || {};
            window.jasmineui.scripturl = event.target.src;
        }
    }

    // Use capturing event listener, as load event of script does not bubble!
    document.addEventListener('load', scriptLoadListener, true);

})();

/**
 * Simple implementation of AMD require/define assuming all
 * modules are named and loaded explicitly, and require is called
 * after all needed modules have been loaded.
 */
(function (window) {
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
        remote:remotePlugin,
        factory:factoryPlugin
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

    var remotePluginWindow;

    function remotePlugin(moduleName) {
        if (!moduleName) {
            return {
                setWindow:function (win) {
                    remotePluginWindow = win;
                },
                getWindow:function () {
                    return remotePluginWindow;
                }
            }
        }
        return function () {
            var res;
            if (!remotePluginWindow) {
                throw new Error("No window set via setWindow yet for remote plugin");
            }
            remotePluginWindow.jasmineui.require([moduleName], function (remoteModule) {
                res = remoteModule;
            });
            return res;
        };
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
        if (typeof callback === 'function') {
            callback.apply(this, resolvedDeps);
        }
        return resolvedDeps;
    };
    require.cache = {};

    window.jasmineui = window.jasmineui || {};
    window.jasmineui.require = require;
    window.jasmineui.define = define;

})(window);
jasmineui.define('scriptAccessor', function () {
    function writeScriptWithUrl(document, url) {
        document.writeln('<script type="text/javascript" src="' + url + '"></script>');
    }

    function writeInlineScript(document, data) {
        document.writeln('<script type="text/javascript">' + data + '</script>');
    }

    /**
     * Calls the given callback after the current script finishes execution.
     * The callback will get one parameter with the url of the executed script.
     * @param callback
     */
    function afterCurrentScript(document, callback) {
        var loadListener = function (event) {
            var node = event.target;
            if (node.nodeName == 'SCRIPT') {
                callback(node.src);
                document.removeEventListener('load', loadListener, true);
            }
        };
        // Use capturing event listener, as load event of script does not bubble!
        document.addEventListener('load', loadListener, true);
    }


    return {
        writeScriptWithUrl:writeScriptWithUrl,
        writeInlineScript:writeInlineScript,
        afterCurrentScript:afterCurrentScript
    }
});jasmineui.define('logger', ['globals'], function (globals) {
    function log(msg) {
        if (enabled()) {
            globals.console.log(msg);
        }
    }

    var _enabled;

    function enabled(value) {
        if (value === undefined) {
            return _enabled;
        } else {
            _enabled = value;
        }
    }

    return {
        log:log,
        enabled: enabled
    }

});jasmineui.define('globals', function () {
    return window;
});jasmineui.define('server/describeUi', ['logger', 'server/jasmineApi', 'server/testwindow', 'server/waitsForAsync', 'remote!client/loadEventSupport', 'scriptAccessor', 'globals'], function (logger, jasmineApi, testwindow, waitsForAsync, loadEventSupportRemote, scriptAccessor, globals) {

    var currentBeforeLoadCallbacks;
    var uiTestScriptUrls = [];

    function addJasmineUiScriptUrl() {
        if (globals.jasmineui.scripturl) {
            uiTestScriptUrls.push(globals.jasmineui.scripturl);
        }
    }
    addJasmineUiScriptUrl();

    function addCurrentScriptToTestWindow() {
        scriptAccessor.afterCurrentScript(globals.document, function (url) {
            uiTestScriptUrls.push(url);
        });
    }

    /**
     * Just like describe, but opens a window with the given url during the test.
     * Also needed for beforeLoad to work.
     * @param name
     * @param pageUrl
     * @param callback
     */
    function describeUi(name, pageUrl, callback) {
        addCurrentScriptToTestWindow();
        function execute() {
            var beforeLoadCallbacks = [];
            jasmineApi.beforeEach(function () {
                var beforeLoadHappened = false;
                jasmineApi.runs(function () {
                    logger.log('Begin open url ' + pageUrl);
                    testwindow(pageUrl, uiTestScriptUrls, function (win) {
                        loadEventSupportRemote().addBeforeLoadListener(function () {
                            beforeLoadHappened = true;
                            for (var i = 0; i < beforeLoadCallbacks.length; i++) {
                                beforeLoadCallbacks[i]();
                            }
                        });
                    });
                });
                waitsForAsync();
                jasmineApi.runs(function () {
                    logger.log('Finished open url ' + pageUrl);
                });
            });
            var oldCallbacks = currentBeforeLoadCallbacks;
            currentBeforeLoadCallbacks = beforeLoadCallbacks;
            callback();
            currentBeforeLoadCallbacks = oldCallbacks;
        }

        jasmineApi.describe(name, execute);
    }

    /**
     * Registers a callback that will be called right before the page loads
     * @param callback
     */
    function beforeLoad(callback) {
        if (!currentBeforeLoadCallbacks) {
            throw new Error("beforeLoad must be called inside of a describeUi statement!");
        }
        currentBeforeLoadCallbacks.push(callback);
    }

    return {
        describeUi:describeUi,
        beforeLoad:beforeLoad
    }
});jasmineui.define('server/jasmineApi', ['globals'], function (globals) {

    function fail(message) {
        globals.jasmine.getEnv().currentSpec.fail(message);
    }

    /**
     * Save the original values, as we are overwriting them in some modules
     */
    return {
        beforeEach:globals.beforeEach,
        afterEach: globals.afterEach,
        describe:globals.describe,
        runs:globals.runs,
        it:globals.it,
        waitsFor:globals.waitsFor,
        waits:globals.waits,
        fail:fail
    }
});jasmineui.define('server/remoteSpecServer', ['server/jasmineApi', 'server/describeUi', 'remote!client/remoteSpecClient', 'server/waitsForAsync'], function (jasmineApi, originalDescribeUi, clientRemote, waitsForAsync) {
    var currentNode;

    function Node(executeCallback) {
        this.executeCallback = executeCallback;
        this.children = {};
        this.childCount = 0;
        this.parent = null;
    }

    Node.prototype = {
        execute:function () {
            this.executed = true;
            var oldNode = currentNode;
            currentNode = this;
            try {
                return this.executeCallback();
            } finally {
                currentNode = oldNode;
            }
        },
        bindExecute:function () {
            var self = this;
            return function () {
                return self.execute();
            }
        },
        addChild:function (type, name, childNode) {
            if (!name) {
                name = '' + this.childCount;
            }
            this.childCount++;
            childNode.name = name;
            childNode.type = type;
            childNode.parent = this;
            this.children[name] = childNode;
        },
        child:function (childId) {
            return this.children[childId];
        },
        path:function () {
            if (this.parent == null) {
                // Ignore Root-Node in the path
                return [];
            } else {
                var res = this.parent.path();
                res.push(this.name);
                return res;
            }
        },
        inDescribeUi:function () {
            if (this.describeUi) {
                return true;
            }
            if (this.parent) {
                return this.parent.inDescribeUi();
            }
            return false;
        },
        toString:function () {
            if (this.parent == null) {
                return [];
            } else {
                var res = this.parent.toString();
                res.push(this.type + ':' + this.name);
                return res;
            }
        }
    };

    var rootNode = new Node(function () {
    });
    currentNode = rootNode;

    function addServerExecutingNode(type, name, callback) {
        var node = new Node(callback);
        currentNode.addChild(type, name, node);
        return node;
    }

    function describe(name, callback) {
        var node = addServerExecutingNode('describe', name, callback);
        jasmineApi.describe(name, node.bindExecute());
    }

    function describeUi(name, pageUrl, callback) {
        var node = addServerExecutingNode('describe', name, callback);
        node.describeUi = true;
        originalDescribeUi.describeUi(name, pageUrl, node.bindExecute());
    }

    function addClientExecutingNode(type, name) {
        var node = new Node(function () {
            return clientRemote().executeSpecNode(node.path());
        });
        currentNode.addChild(type, name, node);
        return node;
    }

    function it(name, callback) {
        if (currentNode.inDescribeUi()) {
            callback = addClientExecutingNode('it', name).bindExecute();
        }
        jasmineApi.it(name, callback);
    }

    function beforeEach(callback) {
        if (currentNode.inDescribeUi()) {
            callback = addClientExecutingNode('beforeEach').bindExecute();
        }
        jasmineApi.beforeEach(callback);
    }

    function afterEach(callback) {
        if (currentNode.inDescribeUi()) {
            callback = addClientExecutingNode('afterEach').bindExecute();
        }
        jasmineApi.afterEach(callback);
    }

    function beforeLoad(callback) {
        originalDescribeUi.beforeLoad(addClientExecutingNode('beforeLoad', undefined).bindExecute());
    }


    /**
     * For runs, waitsFor and waits we create the nodes triggered by the testwindow.
     * This is needed as we do not want to execute it, beforeEach and afterEach
     * on the server (which can contain the runs, ... statements).
     * <p>
     * This will be called from the testwindow!
     */
    function addClientDefinedNode(type, name, extraArgs) {
        var node = currentNode.child(name);
        if (!node) {
            node = addClientExecutingNode(type, name);
        }
        extraArgs = extraArgs || [];
        if (type === 'runs') {
            waitsForAsync();
            jasmineApi.runs(node.bindExecute());
        } else if (type === 'waitsFor') {
            waitsForAsync();
            extraArgs.unshift(node.bindExecute());
            jasmineApi.waitsFor.apply(this, extraArgs);
        } else if (type === 'waits') {
            jasmineApi.waits.apply(this, extraArgs);
        }
    }

    return {
        it:it,
        beforeEach:beforeEach,
        afterEach:afterEach,
        beforeLoad:beforeLoad,
        describe:describe,
        describeUi:describeUi,
        addClientDefinedSpecNode:addClientDefinedNode
    }
});jasmineui.define('server/testwindow', ['remote!', 'remote!client/reloadMarker', 'scriptAccessor', 'globals'], function (remotePlugin, reloadMarkerApi, scriptAccessor, globals) {
    var window = globals.window;

    function splitAtHash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos != -1) {
            return [url.substring(0, hashPos), url.substring(hashPos + 1)];
        } else {
            return [url, ''];
        }
    }

    var _testwindow;

    /**
     * Creates a testwindow with the given url.
     * Injects the scripts with the given urls and calls the given callback after
     * the scripts were executed.
     */
    function testwindow(url, scriptUrls, callback) {
        if (arguments.length === 0) {
            return _testwindow;
        }
        if (url.charAt(0) !== '/') {
            // We need absolute paths because of the check later with location.pathname.
            throw new Error("Absolute paths are required");
        }
        if (!_testwindow) {
            _testwindow = window.open(url, 'jasmineui');
            remotePlugin.setWindow(_testwindow);
        } else {
            // Set a flag to detect whether the
            // window is currently in a reload cycle.
            reloadMarkerApi(_testwindow).requireReload();
            var oldPath = _testwindow.location.pathname;
            // if only the hash changes, the
            // page will not reload by assigning the href but only
            // change the hashpath.
            // So detect this and do a manual reload.
            var urlSplitAtHash = splitAtHash(url);
            if (oldPath === urlSplitAtHash[0]) {
                _testwindow.location.hash = urlSplitAtHash[1];
                _testwindow.location.reload();
            } else {
                _testwindow.location.href = url;
            }
        }

        globals.instrument = function (fr) {
            for (var i = 0; i < scriptUrls.length; i++) {
                scriptAccessor.writeScriptWithUrl(fr.document, scriptUrls[i]);
            }
            testwindow.afterScriptInjection = function () {
                callback(fr);
            };
            var inlineScript = function () {
                jasmineui.require(['remote!server/testwindow'], function (testwindowRemote) {
                    testwindowRemote().afterScriptInjection();
                })
            };
            scriptAccessor.writeInlineScript(fr.document, '(' + inlineScript + ')();');
        };

        return _testwindow;
    }

    return testwindow;

});jasmineui.define('server/waitsForAsync', ['logger', 'server/jasmineApi', 'remote!', 'remote!client/asyncSensor'], function (logger, jasmineApi, remotePlugin, asyncSensorRemote) {
    var timeout = 5000;

    /**
     * Waits for the end of all asynchronous actions.
     */
    function waitsForAsync() {
        jasmineApi.runs(function () {
            logger.log("begin async waiting");
        });
        // Wait at least 50 ms. Needed e.g.
        // for animations, as the animation start event is
        // not fired directly after the animation css is added.
        // There may also be a gap between changing the location hash
        // and the hashchange event (almost none however...).
        jasmineApi.waits(50);
        jasmineApi.waitsFor(
            function () {
                var testwin = remotePlugin.getWindow();
                if (!testwin) {
                    return false;
                }
                if (testwin.document.readyState !== 'complete') {
                    return false;
                }
                // On the first open, the testwindow contains the empty page,
                // which has document.readyState==complete, but nothing in it.
                if (!testwin.jasmineui) {
                    return false;
                }
                return !asyncSensorRemote()();
            }, "async work", timeout);
        jasmineApi.runs(function () {
            logger.log("end async waiting");
        });
    }

    function setTimeout(_timeout) {
        timeout = _timeout;
    }

    waitsForAsync.setTimeout = setTimeout;

    return waitsForAsync;
});jasmineui.define('client/asyncSensor', ['globals', 'logger', 'client/loadEventSupport', 'client/reloadMarker'], function (globals, logger, loadEventSupport, reloadMarker) {
    var window = globals.window;
    var asyncSensors = {};

    /**
     * Adds a sensor.
     * A sensor is a function that returns whether asynchronous work is going on.
     *
     * @param name
     * @param sensor Function that returns true/false.
     */
    function addAsyncSensor(name, sensor) {
        asyncSensors[name] = sensor;
    }

    function isAsyncProcessing() {
        var sensors = asyncSensors;
        for (var name in sensors) {
            if (sensors[name]()) {
                logger.log("async processing: " + name);
                return true;
            }
        }
        return false;
    }

    /**
     * Adds an async sensor for the load event
     */
    (function () {
        addAsyncSensor('loading', function () {
            return !loadEventSupport.loaded();
        });
    })();

    /**
     * Adds an async sensor for the reload
     */
    (function () {
        addAsyncSensor('reload', function () {
            return reloadMarker.inReload();
        });
    })();

    /**
     * Adds an async sensor for the window.setTimeout function.
     */
    (function () {
        var timeouts = {};
        if (!window.oldTimeout) {
            window.oldTimeout = window.setTimeout;
        }
        window.setTimeout = function (fn, time) {
            logger.log("setTimeout called");
            var handle;
            var callback = function () {
                delete timeouts[handle];
                logger.log("timed out");
                if (typeof fn == 'string') {
                    eval(fn);
                } else {
                    fn();
                }
            };
            handle = window.oldTimeout(callback, time);
            timeouts[handle] = true;
            return handle;
        };

        window.oldClearTimeout = window.clearTimeout;
        window.clearTimeout = function (code) {
            logger.log("clearTimeout called");
            window.oldClearTimeout(code);
            delete timeouts[code];
        };
        addAsyncSensor('timeout', function () {
            var count = 0;
            for (var x in timeouts) {
                count++;
            }
            return count != 0;
        });
    })();

    /**
     * Adds an async sensor for the window.setInterval function.
     */
    (function () {
        var intervals = {};
        window.oldSetInterval = window.setInterval;
        window.setInterval = function (fn, time) {
            logger.log("setInterval called");
            var callback = function () {
                if (typeof fn == 'string') {
                    eval(fn);
                } else {
                    fn();
                }
            };
            var res = window.oldSetInterval(callback, time);
            intervals[res] = 'true';
            return res;
        };

        window.oldClearInterval = window.clearInterval;
        window.clearInterval = function (code) {
            logger.log("clearInterval called");
            window.oldClearInterval(code);
            delete intervals[code];
        };
        // return a function that allows to check
        // if an interval is running...
        addAsyncSensor('interval', function () {
            var count = 0;
            for (var x in intervals) {
                count++;
            }
            return count != 0;
        });
    })();

    /**
     * Adds an async sensor for the window.XMLHttpRequest.
     */
    (function () {
        var jasmineWindow = window;
        var copyStateFields = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
        var proxyMethods = ['abort', 'getAllResponseHeaders', 'getResponseHader', 'open', 'send', 'setRequestHeader'];

        var oldXHR = window.XMLHttpRequest;
        window.openCallCount = 0;
        var DONE = 4;
        var newXhr = function () {
            var self = this;
            this.origin = new oldXHR();

            function copyState() {
                for (var i = 0; i < copyStateFields.length; i++) {
                    var field = copyStateFields[i];
                    try {
                        self[field] = self.origin[field];
                    } catch (_) {
                    }
                }
            }

            function proxyMethod(name) {
                self[name] = function () {
                    if (name == 'send') {
                        window.openCallCount++;
                    }
                    var res = self.origin[name].apply(self.origin, arguments);
                    copyState();
                    return res;
                }
            }

            for (var i = 0; i < proxyMethods.length; i++) {
                proxyMethod(proxyMethods[i]);
            }
            this.origin.onreadystatechange = function () {
                if (self.origin.readyState == DONE) {
                    window.openCallCount--;
                }
                copyState();
                if (self.onreadystatechange) {
                    self.onreadystatechange.apply(self.origin, arguments);
                }
            };
            copyState();
        };
        window.XMLHttpRequest = newXhr;

        addAsyncSensor('xhr',
            function () {
                return window.openCallCount != 0;
            });
    })();

    /**
     * Adds an async sensor for the webkitAnimationStart and webkitAnimationEnd events.
     * Note: The animationStart event is usually fired some time
     * after the animation was added to the css of an element (approx 50ms).
     * So be sure to always wait at least that time!
     */
    (function () {
        var animationCount = 0;
        loadEventSupport.addBeforeLoadListener(function () {
            if (!(globals.$ && globals.$.fn && globals.$.fn.animationComplete)) {
                return;
            }
            var oldFn = globals.$.fn.animationComplete;
            globals.$.fn.animationComplete = function (callback) {
                animationCount++;
                return oldFn.call(this, function () {
                    animationCount--;
                    return callback.apply(this, arguments);
                });
            };
            addAsyncSensor('WebkitAnimation',
                function () {
                    return animationCount != 0;
                });

        });

    })();

    /**
     * Adds an async sensor for the webkitTransitionStart and webkitTransitionEnd events.
     * Note: The transitionStart event is usually fired some time
     * after the animation was added to the css of an element (approx 50ms).
     * So be sure to always wait at least that time!
     */
    (function () {
        var transitionCount = 0;
        loadEventSupport.addBeforeLoadListener(function () {
            if (!(globals.$ && globals.$.fn && globals.$.fn.animationComplete)) {
                return;
            }

            var oldFn = globals.$.fn.transitionComplete;
            globals.$.fn.transitionComplete = function (callback) {
                transitionCount++;
                return oldFn.call(this, function () {
                    transitionCount--;
                    return callback.apply(this, arguments);
                });
            };
            addAsyncSensor('WebkitTransition',
                function () {
                    return transitionCount != 0;
                });

        });
    })();


    return isAsyncProcessing;
});jasmineui.define('client/errorHandler', ['globals', 'remote!server/jasmineApi'], function (globals, jasmineApiRemote) {
    var window = globals.window;

    // Use a capturing listener so we receive all errors!
    window.addEventListener('error', errorHandler, true);

    /**
     * Error listener in the opened window to make the spec fail on errors.
     */
    function errorHandler(event) {
        jasmineApiRemote().fail(event.message);
    }
});jasmineui.define('client/loadEventSupport', ['globals'], function (globals) {
    var window = globals.window;
    var document = globals.document;

    var beforeLoadListeners = [];

    /**
     * Adds a listener for the beforeLoad-Event that will be called every time a new url is loaded
     * @param callback
     */
    var addBeforeLoadListener = function (callback) {
        beforeLoadListeners.push(callback);
    };

    var beforeLoadEventFired = false;

    function callBeforeLoadListeners() {
        beforeLoadEventFired = true;
        var name, listeners, fn;
        listeners = beforeLoadListeners;
        for (name in listeners) {
            fn = listeners[name];
            fn(window);
        }
    }

    /**
     * We use a capturing event listener to be the first to get the event.
     * jQuery, ... always use non capturing event listeners...
     */
    document.addEventListener('DOMContentLoaded', loadCallback, true);

    function loadCallback() {
        /*
         * When using a script loader,
         * the document might be ready, but not the modules.
         */
        if (scriptLoaderIsReady()) {
            callBeforeLoadListeners();
        } else {
            setScriptLoaderBeforeLoadEvent(callBeforeLoadListeners);
        }
        return true;
    }

    /**
     * Must not be called before the load event of the document!
     */
    function scriptLoaderIsReady() {
        if (globals.require) {
            return globals.require.resourcesDone;
        }
        return true;
    }

    function setScriptLoaderBeforeLoadEvent(listener) {
        var oldResourcesReady = globals.require.resourcesReady;
        globals.require.resourcesReady = function (ready) {
            if (ready) {
                listener();
            }
            return oldResourcesReady.apply(this, arguments);
        };
    }

    function loaded() {
        var docReady = document.readyState == 'complete';
        if (docReady) {
            return scriptLoaderIsReady();
        }
        return docReady;
    }

    return {
        addBeforeLoadListener:addBeforeLoadListener,
        loaded:loaded
    }
});jasmineui.define('client/reloadMarker', function () {
    var value = false;

    function inReload() {
        return value;
    }

    function requireReload() {
        value = true;
    }

    return {
        inReload:inReload,
        requireReload:requireReload
    }
});jasmineui.define('client/remoteSpecClient', ['remote!server/remoteSpecServer'], function (serverRemote) {
    var currentNode;

    function Node(executeCallback) {
        this.executeCallback = executeCallback;
        this.children = {};
        this.childCount = 0;
        this.parent = null;
    }

    Node.prototype = {
        execute:function () {
            this.executed = true;
            var oldNode = currentNode;
            currentNode = this;
            try {
                return this.executeCallback();
            } finally {
                currentNode = oldNode;
            }
        },
        addChild:function (type, name, childNode) {
            if (!name) {
                name = '' + this.childCount;
            }
            this.childCount++;
            childNode.name = name;
            childNode.type = type;
            childNode.parent = this;
            this.children[name] = childNode;
        },
        child:function (childId) {
            if (!this.executed) {
                this.execute();
            }
            return this.children[childId];
        },
        findChild:function (childPath) {
            if (childPath.length === 0) {
                return this;
            }
            var childId = childPath.shift();
            var child = this.child(childId);
            if (!child) {
                throw new Error("Cannot find child " + childId + " in " + this.toString());
            }
            return child.findChild(childPath);
        },
        path:function () {
            if (this.parent == null) {
                // Ignore Root-Node in the path
                return [];
            } else {
                var res = this.parent.path();
                res.push(this.name);
                return res;
            }
        },
        toString:function () {
            if (this.parent == null) {
                return [];
            } else {
                var res = this.parent.toString();
                res.push(this.type + ':' + this.name);
                return res;
            }
        }
    };

    var rootNode = new Node(function () {
    });
    currentNode = rootNode;
    var currentExecuteNode;

    function addNode(type, name, callback) {
        var node = new Node(callback);
        currentNode.addChild(type, name, node);
        return node;
    }

    var beforeLoad = function (callback) {
        addNode('beforeLoad', null, callback);
    };

    var describeUi = function (name, pageUrl, callback) {
        addNode('describe', name, callback);
    };

    var describe = function (name, callback) {
        addNode('describe', name, callback);
    };

    var it = function (name, callback) {
        addNode('it', name, callback);
    };

    var beforeEach = function (callback) {
        addNode('beforeEach', null, callback);
    };

    var afterEach = function (callback) {
        addNode('afterEach', null, callback);
    };

    function addLocallyDefinedNode(type, name, callback, extraArgs) {
        var node = addNode(type, name, callback);
        // Only add a node like runs, waitsFor, ... if the server called us
        // first for the parent node. This is important if
        // we have a page reload within an "it" statement:
        // The server then already knows about all required runs from the
        // first testwindow!
        if (currentNode == currentExecuteNode) {
            serverRemote().addClientDefinedSpecNode(type, node.name, extraArgs);
        }
    }

    var runs = function (callback) {
        addLocallyDefinedNode('runs', undefined, callback);
    };

    var waitsFor = function (callback) {
        addLocallyDefinedNode('waitsFor', undefined, callback, Array.prototype.slice.call(arguments, 1));
    };

    var waits = function () {
        addLocallyDefinedNode('waits', undefined, function () {
        }, Array.prototype.slice.call(arguments));
    };

    var executeSpecNode = function (nodePath) {
        var oldNode = currentExecuteNode;
        currentExecuteNode = rootNode.findChild(nodePath);
        try {
            return currentExecuteNode.execute();
        } finally {
            oldNode = currentExecuteNode;
        }
    };

    return {
        describe:describe,
        describeUi:describeUi,
        it:it,
        beforeEach:beforeEach,
        afterEach:afterEach,
        beforeLoad:beforeLoad,
        runs:runs,
        waitsFor:waitsFor,
        waits:waits,
        executeSpecNode:executeSpecNode
    }
});jasmineui.define('client/simulateEvent', function () {
    /**
     * Functions to simulate events.
     * Based upon https://github.com/jquery/jquery-ui/blob/master/tests/jquery.simulate.js
     * Can also handle elements from different frames.
     * <p>
     * Provides:
     * simulate(el, type, options)
     */
    function simulate(el, type, options) {
        options = extend({}, simulate.defaults, options || {});
        var document = el.ownerDocument;
        simulateEvent(document, el, type, options);
    }

    function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                target[key] = obj[key];
            }
        }
        return target;
    }

    function simulateEvent(document, el, type, options) {
        var evt = createEvent(document, type, options);
        dispatchEvent(el, type, evt);
        return evt;
    }

    function createEvent(document, type, options) {
        if (/^mouse(over|out|down|up|move)|(dbl)?click$/.test(type)) {
            return mouseEvent(document, type, options);
        } else if (/^key(up|down|press)$/.test(type)) {
            return keyboardEvent(document, type, options);
        } else {
            return otherEvent(document, type, options);
        }
    }

    function mouseEvent(document, type, options) {
        var evt;
        var e = extend({
            bubbles:true, cancelable:(type != "mousemove"), detail:0,
            screenX:0, screenY:0, clientX:0, clientY:0,
            ctrlKey:false, altKey:false, shiftKey:false, metaKey:false,
            button:0, relatedTarget:undefined
        }, options);

        var relatedTarget = e.relatedTarget;

        if (typeof document.createEvent == 'function') {
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(type, e.bubbles, e.cancelable, e.view, e.detail,
                e.screenX, e.screenY, e.clientX, e.clientY,
                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                e.button, e.relatedTarget || document.body.parentNode);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
            evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
        }
        return evt;
    }

    function keyboardEvent(document, type, options) {
        var evt;

        var e = extend({ bubbles:true, cancelable:true,
            ctrlKey:false, altKey:false, shiftKey:false, metaKey:false,
            keyCode:0, charCode:0
        }, options);

        if (typeof document.createEvent == 'function') {
            try {
                evt = document.createEvent("KeyEvents");
                evt.initKeyEvent(type, e.bubbles, e.cancelable, e.view,
                    e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                    e.keyCode, e.charCode);
            } catch (err) {
                evt = document.createEvent("Events");
                evt.initEvent(type, e.bubbles, e.cancelable);
                extend(evt, { view:e.view,
                    ctrlKey:e.ctrlKey, altKey:e.altKey, shiftKey:e.shiftKey, metaKey:e.metaKey,
                    keyCode:e.keyCode, charCode:e.charCode
                });
            }
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
        }
        return evt;
    }

    function otherEvent(document, type, options) {
        var evt;

        var e = extend({ bubbles:true, cancelable:true
        }, options);

        if (typeof document.createEvent == 'function') {
            evt = document.createEvent("Events");
            evt.initEvent(type, e.bubbles, e.cancelable);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
        }
        return evt;
    }

    function dispatchEvent(el, type, evt) {
        if (el.dispatchEvent) {
            el.dispatchEvent(evt);
        } else if (el.fireEvent) {
            el.fireEvent('on' + type, evt);
        }
        return evt;
    }

    extend(simulate, {
        defaults:{
            speed:'sync'
        },
        VK_TAB:9,
        VK_ENTER:13,
        VK_ESC:27,
        VK_PGUP:33,
        VK_PGDN:34,
        VK_END:35,
        VK_HOME:36,
        VK_LEFT:37,
        VK_UP:38,
        VK_RIGHT:39,
        VK_DOWN:40
    });

    return simulate;

});(function () {
    var logEnabled = true;
    var waitsForAsyncTimeout = 5000;

    if (opener) {
        jasmineui.require(['logger', 'remote!', 'client/reloadMarker', 'client/remoteSpecClient', 'client/simulateEvent', 'client/errorHandler'], function (logger, remotePlugin, reloadMarker, remoteSpecClient, simulate) {
            logger.enabled(logEnabled);
            remotePlugin.setWindow(opener);
            window.xdescribe = function () {
            };
            window.xdescribeUi = function () {
            };
            window.xit = function () {
            };
            window.expect = opener.expect;
            window.jasmine = opener.jasmine;
            window.spyOn = opener.spyOn;

            window.describe = remoteSpecClient.describe;
            window.describeUi = remoteSpecClient.describeUi;
            window.it = remoteSpecClient.it;
            window.beforeEach = remoteSpecClient.beforeEach;
            window.afterEach = remoteSpecClient.afterEach;
            window.beforeLoad = remoteSpecClient.beforeLoad;
            window.runs = remoteSpecClient.runs;
            window.waitsFor = remoteSpecClient.waitsFor;
            window.waits = remoteSpecClient.waits;
            window.waitForReload = reloadMarker.requireReload;
            window.simulate = simulate;
        });
    } else {
        jasmineui.require(['server/remoteSpecServer', 'server/waitsForAsync', 'logger'], function (remoteSpecServer, waitsForAsync, logger) {
            logger.enabled(logEnabled);

            window.it = remoteSpecServer.it;
            window.beforeEach = remoteSpecServer.beforeEach;
            window.afterEach = remoteSpecServer.afterEach;
            window.beforeLoad = remoteSpecServer.beforeLoad;
            window.describeUi = remoteSpecServer.describeUi;
            window.describe = remoteSpecServer.describe;
            window.xdescribeUi = window.xdescribe;

            waitsForAsync.setTimeout(waitsForAsyncTimeout);
        });
    }
});
