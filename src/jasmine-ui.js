/**
 * The MIT License
 *
 * Copyright (c) 2011 Tobias Bosch (OPITZ CONSULTING GmbH, www.opitz-consulting.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

jasmineui = {};

/**
 * The central logging function.
 */
jasmineui.log = function (msg) {
    // console.log(msg);
};


jasmineui.server = function () {

    /**
     * describeUi: describeUi: execute ui tests in the testwindow directly.
     */
    (function () {
        var currentNode;

        function Node(executeCallback) {
            this.executeCallback = executeCallback;
            this.children = {};
            this.childCount = 0;
            this.parent = null;
        }
        Node.prototype = {
            execute: function() {
                this.executed = true;
                var oldNode = currentNode;
                currentNode = this;
                try {
                    return this.executeCallback();
                } finally {
                    currentNode = oldNode;
                }
            },
            bindExecute: function() {
                var self = this;
                return function() {
                    return self.execute();
                }
            },
            addChild: function(name, childNode) {
                if (!name) {
                    name = ''+this.childCount;
                }
                this.childCount++;
                childNode.name = name;
                childNode.parent = this;
                this.children[name] = childNode;
            },
            child: function(childId) {
                return this.children[childId];
            },
            findChild: function(childPath) {
                if (childPath.length===0) {
                    return this;
                }
                return this.child(childPath.shift()).findChild(childPath);
            },
            path: function() {
                if (this.parent==null) {
                    // Ignore Root-Node in the path
                    return [];
                } else {
                    var res = this.parent.path();
                    res.push(this.name);
                    return res;
                }
            },
            inDescribeUi: function() {
                if (this.describeUi) {
                    return true;
                }
                if (this.parent) {
                    return this.parent.inDescribeUi();
                }
                return false;
            }
        };

        jasmineui.original = {
            describe: window.describe,
            it: window.it,
            beforeEach: window.beforeEach,
            afterEach: window.afterEach
        };

        var rootNode = new Node(function() { });
        currentNode = rootNode;

        function addLocallyDefinedAndRemoteExecutingNode(name) {
            var node = new Node(function() {
                return jasmineui.testwindow().jasmineui.executeNode(node.path());
            });
            currentNode.addChild(name, node);
            return node;
        }

        window.xit = function() { };
        window.it = function (name, callback) {
            if (currentNode.inDescribeUi()) {
                jasmineui.original.it(name, addLocallyDefinedAndRemoteExecutingNode(name).bindExecute());
            } else {
                jasmineui.original.it(name, callback);
            }
        };

        window.beforeEach = function (callback) {
            if (currentNode.inDescribeUi()) {
                jasmineui.original.beforeEach(addLocallyDefinedAndRemoteExecutingNode(undefined).bindExecute());
            } else {
                jasmineui.original.beforeEach(callback);
            }
        };

        window.afterEach = function (callback) {
            if (currentNode.inDescribeUi()) {
                jasmineui.original.afterEach(addLocallyDefinedAndRemoteExecutingNode(undefined).bindExecute());
            } else {
                jasmineui.original.afterEach(callback);
            }
        };

        /**
         * For runs, waitsFor and waits we create the nodes triggered by the testwindow.
         * This is needed as we do not want to execute it, beforeEach and afterEach
         * on the server.
         * <p>
         * This will be called from the testwindow!
         */
        jasmineui.addRemoteDefinedNodeIfNeeded = function(type, parentPath, nodeName, extraArgs) {
            var parent = rootNode.findChild(parentPath);
            var node = parent.child(nodeName);
            if (node) {
                return;
            }
            node = new Node(function() {
                return jasmineui.testwindow().jasmineui.executeNode(node.path());
            });
            parent.addChild(nodeName, node);
            extraArgs = extraArgs || [];
            if (type==='runs') {
                runs(node.bindExecute());
            } else if (type==='waitsFor') {
                extraArgs.unshift(node.bindExecute());
                waitsFor.apply(this, extraArgs);
            } else if (type==='waits') {
                waits.apply(this, extraArgs);
            } else if (type==='waitsForAsync') {
                jasmineui.waitsForAsync.apply(this, extraArgs);
            } else if (type==='waitsForReload') {
                jasmineui.waitsForReload.apply(this, extraArgs);
            }
        };

        function createDescribeNode(name, callback, describeUi) {
            var node = new Node(callback);
            currentNode.addChild(name, node);
            node.describeUi = describeUi;
            jasmineui.original.describe(name, node.bindExecute());
            return node;
        }

        window.xdescribe = function() { };
        window.describe = function(name, callback) {
            createDescribeNode(name, callback, false);
        };

        window.xdescribeUi = function() { };
        window.describeUi = function (name, pageUrl, callback) {
            var describeNode;
            function execute() {
                jasmineui.original.beforeEach(function () {
                    jasmineui.loadHtml(pageUrl, function () {
                        var nodes = describeNode.beforeLoadNodes || [];
                        for (var i = 0; i < nodes.length; i++) {
                            nodes[i].execute();
                        }
                    });
                });
                callback();
            }
            describeNode = createDescribeNode(name, execute, true);
        };

        /**
         * Registers a callback that will be called right before the page loads
         * @param callback
         */
        window.beforeLoad = function (callback) {
            var node = addLocallyDefinedAndRemoteExecutingNode(undefined);
            currentNode.beforeLoadNodes = currentNode.beforeLoadNodes || [];
            currentNode.beforeLoadNodes.push(node);
        };

    })();

    /**
     * jasmineui.testwindow(url): This function is able to create a testframe
     * with a given url.
     */
    (function (window) {
        function splitAtHash(url) {
            var hashPos = url.indexOf('#');
            if (hashPos != -1) {
                return [url.substring(0, hashPos), url.substring(hashPos + 1)];
            } else {
                return [url, ''];
            }
        }

        var testwindow;
        window.jasmineui.testwindow = function (url) {
            if (arguments.length > 0) {
                if (!url.charAt(0) == '/') {
                    throw new Error("the url for the testframe needs to be absolute!");
                }
                if (!testwindow) {
                    testwindow = window.open(url, 'jasmineui');
                }
                var oldPath = testwindow.location.pathname;
                // if only the hash changes, the
                // page will not reload by assigning the href but only
                // change the hashpath.
                // So detect this and do a manual reload.
                var urlSplitAtHash = splitAtHash(url);
                if (oldPath === urlSplitAtHash[0]) {
                    testwindow.location.hash = urlSplitAtHash[1];
                    testwindow.location.reload();
                } else {
                    testwindow.location.href = url;
                }
            }
            return testwindow;
        };

    })(window);


    /**
     * Jasmine UI Plugin for loading and instrumenting a page into a testwindow().
     */
    (function () {
        function findScripts(urlCallback) {
            var scripts = document.getElementsByTagName("script");
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (script.src) {
                    urlCallback(script.src);
                }
            }
        }

        /**
         * Loads the given url into the testframe and waits
         * until the page is fully loaded.
         * @param url
         * @param beforeLoadCallback A callback that will be executed only once
         */
        jasmineui.loadHtml = function (url, beforeLoadCallback) {
            runs(function () {
                // If we have an old testwindow,
                // be sure to wait until the reload of that testwindow!
                if (jasmineui.testwindow()) {
                    jasmineui.testwindow().inReload = true;
                }
                jasmineui.testwindow(url);

                // Always add jasmine-ui, the specs and all helper to the testwindow.
                var scriptUrls = [];
                findScripts(function (url) {
                    if (url.match('jasmine-ui[^/]*$')|| url.match('Spec[^/]*$')|| url.match('SpecHelper[^/]*$') ) {
                        scriptUrls.push(url);
                    }
                });

                window.instrument = function (fr) {
                    jasmineui.log("Begin instrumenting frame " + fr.name + " with url " + fr.location.href);
                    for (var i=0; i<scriptUrls.length; i++) {
                        fr.document.writeln('<script src="' + scriptUrls[i] + '"></script>');
                    }
                    if (beforeLoadCallback) {
                        fr.extraBeforeLoadListener = beforeLoadCallback;
                        beforeLoadCallback = null;
                    }
                };
            });
            jasmineui.waitsForAsync();
            runs(function () {
                jasmineui.log("Successfully loaded url " + url);
            });

        };
    })();


    /**
     * Jasmine UI Multi-Page Plugin to wait for the load of a new page.
     */
    (function () {
        /**
         * Waits for the new page to be loaded.

         * @param timeout
         */
        jasmineui.waitsForReload = function (timeout) {
            if (!timeout) {
                timeout = 10000;
            }
            runs(function () {
                jasmineui.testwindow().inReload = true;
            });
            waitsFor(function () {
                return !jasmineui.testwindow().inReload;
            }, timeout);
            jasmineui.waitsForAsync(timeout);
        };
    })();

    /**
     * Jasmine UI Plugin for waiting for the end of asynchronous actions.
     */
    (function () {
        jasmineui.waitsForAsync = function (timeout) {
            if (!timeout) {
                timeout = 5000;
            }
            // Wait at least 50 ms. Needed e.g.
            // for animations, as the animation start event is
            // not fired directly after the animation css is added.
            // There may also be a gap between changing the location hash
            // and the hashchange event (almost none however...).
            waits(100);
            runs(function () {
                jasmineui.log("begin async waiting");
            });
            waitsFor(
                function () {
                    return !jasmineui.testwindow().jasmineui.isWaitForAsync()
                }, "end of async work", timeout);
            runs(function () {
                jasmineui.log("end async waiting");
            });
        };
    })();
};


/**
 * Only used on the client side.
 */
jasmineui.client = function () {
    /**
     * describeUi integration: Stores callbacks to be called from the jasmine spec.
     */
    (function () {
        var currentNode;

        function Node(executeCallback) {
            this.executeCallback = executeCallback;
            this.children = {};
            this.childCount = 0;
            this.parent = null;
        }
        Node.prototype = {
            execute: function() {
                this.executed = true;
                var oldNode = currentNode;
                currentNode = this;
                try {
                    return this.executeCallback();
                } finally {
                    currentNode = oldNode;
                }
            },
            addChild: function(name, childNode) {
                if (!name) {
                    name = ''+this.childCount;
                }
                this.childCount++;
                childNode.name = name;
                childNode.parent = this;
                this.children[name] = childNode;
            },
            child: function(childId) {
                if (!this.executed) {
                    this.execute();
                }
                return this.children[childId];
            },
            findChild: function(childPath) {
                if (childPath.length===0) {
                    return this;
                }
                return this.child(childPath.shift()).findChild(childPath);
            },
            path: function() {
                if (this.parent==null) {
                    // Ignore Root-Node in the path
                    return [];
                } else {
                    var res = this.parent.path();
                    res.push(this.name);
                    return res;
                }
            }
        };

        var rootNode = new Node(function() { });
        currentNode = rootNode;

        window.xdescribe = function() { };
        window.xdescribeUi = function() { };
        window.xit = function() { };

        window.beforeLoad = function(callback) {
            addRemoteDefinedAndLocallyExecutingNode(null, callback);
        };

        function addRemoteDefinedAndLocallyExecutingNode(name, callback) {
            currentNode.addChild(name, new Node(callback));
        }

        window.describeUi = function (name, pageUrl, callback) {
            addRemoteDefinedAndLocallyExecutingNode(name, callback);
        };

        window.describe = function(name, callback) {
            addRemoteDefinedAndLocallyExecutingNode(name, callback);
        };

        window.it = function (name, callback) {
            addRemoteDefinedAndLocallyExecutingNode(name, callback);
        };

        window.beforeEach = function (callback) {
            addRemoteDefinedAndLocallyExecutingNode(null, callback);
        };

        window.afterEach = function (callback) {
            addRemoteDefinedAndLocallyExecutingNode(null, callback);
        };

        function addLocallyDefinedNode(type, callback, extraArgs) {
            var node = new Node(callback);
            currentNode.addChild(null, node);
            opener.jasmineui.addRemoteDefinedNodeIfNeeded(type, node.parent.path(), node.name, extraArgs);
        }

        window.runs = function(callback) {
            addLocallyDefinedNode('runs', callback);
        };

        window.waitsFor = function(callback) {
            var originalArgs = arguments;
            addLocallyDefinedNode('waitsFor', function() {
                return callback.apply(this, originalArgs);
            });
        };

        window.waits = function(timeout) {
            addLocallyDefinedNode('waits', function() { }, [timeout]);
        };

        window.waitsForAsync = function(timeout) {
            addLocallyDefinedNode('waitsForAsync', [timeout]);
        };
        window.waitsForReload = function(timeout) {
            addLocallyDefinedNode('waitsForReload', [timeout]);
        };

        window.expect = opener.expect;

        jasmineui.executeNode = function (nodePath) {
            var node = rootNode.findChild(nodePath);
            return node.execute();
        }
    })();

    /**
     * Jasmine UI Plugin for waiting for the end of asynchronous actions.
     */
    (function () {
        var asyncWaitHandlers = {};

        /**
         * Adds a handler to the async wait functionality.
         * A handler is a function that returns whether asynchronous work is going on.
         *
         * @param name
         * @param handler Function that returns true/false.
         */
        jasmineui.addAsyncWaitHandler = function (name, handler) {
            asyncWaitHandlers[name] = handler;
        };

        jasmineui.isWaitForAsync = function () {
            var handlers = asyncWaitHandlers;
            for (var name in handlers) {
                if (handlers[name]()) {
                    jasmineui.log("async waiting for " + name);
                    return true;
                }
            }
            if (window.jQuery) {
                if (!window.jQuery.isReady) {
                    jasmineui.log("async waiting for jquery ready");
                    return true;
                }
            }
            jasmineui.log("end waiting for async");
            return false;
        };
    })();

    /**
     * Jasmine UI Plugin for loading and instrumenting a page.
     */
    (function () {
        var beforeLoadListeners = [];
        if (window.extraBeforeLoadListener) {
            beforeLoadListeners.push(window.extraBeforeLoadListener);
        }

        /**
         * Adds a listener for the beforeLoad-Event that will be called every time a new url is loaded
         * @param callback
         */
        jasmineui.addBeforeLoadListener = function (callback) {
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

        jasmineui.addAsyncWaitHandler('loading', function () {
            return !beforeLoadEventFired;
        });


        function proxyAddEventFunction(baseObject, fnname, eventProxyMap) {
            var oldFnname = 'old' + fnname;
            baseObject[oldFnname] = baseObject[fnname];
            baseObject[fnname] = function () {
                var event = arguments[0];
                var callback = arguments[1];
                var newCallback = callback;
                var proxyCallback = eventProxyMap[event];
                if (proxyCallback) {
                    newCallback = function () {
                        proxyCallback.apply(this, arguments);
                        return callback.apply(this, arguments);
                    }
                }
                arguments[1] = newCallback;
                return baseObject[oldFnname].apply(this, arguments);
            }
        }

        function addLoadEventListenerToWindow() {
            var loadCallbackCalled = false;

            function loadCallback() {
                if (loadCallbackCalled) {
                    return;
                }
                loadCallbackCalled = true;
                if (!window.require) {
                    callBeforeLoadListeners();
                    return;
                }
                /*
                 * When using require.js, and all libs are in one file,
                 * we might not be able to intercept the point in time
                 * when everything is loaded, but the ready signal was not yet sent.
                 */
                var require = window.require;
                if (require.resourcesDone) {
                    callBeforeLoadListeners();
                } else {
                    var oldResourcesReady = require.resourcesReady;
                    require.resourcesReady = function (ready) {
                        if (ready) {
                            callBeforeLoadListeners();
                        }
                        return oldResourcesReady.apply(this, arguments);
                    };
                }
                return true;
            }

            // Mozilla, Opera and webkit nightlies currently support this event
            if (document.addEventListener) {
                // Be sure that our handler gets called before any
                // other handler of the instrumented page!
                proxyAddEventFunction(document, 'addEventListener', {'DOMContentLoaded':loadCallback});
                proxyAddEventFunction(window, 'addEventListener', {'load':loadCallback});

                // A fallback to window.onload, that will always work
                window.addEventListener("load", loadCallback, false);

            } else if (document.attachEvent) {
                // If IE event model is used
                // Be sure that our handler gets called before any
                // other handler of the instrumented page!
                proxyAddEventFunction(document, 'attachEvent', {'onreadystatechange':loadCallback});
                proxyAddEventFunction(window, 'attachEvent', {'load':loadCallback});

                // A fallback to window.onload, that will always work
                window.attachEvent("onload", loadCallback);
            }
        }

        addLoadEventListenerToWindow();
    })();

    /**
     * Adds a loadHtmlListener that adds an async wait handler for the window.setTimeout function.
     */
    (function () {
        var timeouts = {};
        if (!window.oldTimeout) {
            window.oldTimeout = window.setTimeout;
        }
        window.setTimeout = function (fn, time) {
            jasmineui.log("setTimeout called");
            var handle;
            var callback = function () {
                delete timeouts[handle];
                jasmineui.log("timed out");
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
            jasmineui.log("clearTimeout called");
            window.oldClearTimeout(code);
            delete timeouts[code];
        };
        jasmineui.addAsyncWaitHandler('timeout', function () {
            var count = 0;
            for (var x in timeouts) {
                count++;
            }
            return count != 0;
        });
    })();

    /**
     * Adds a loadHtmlListener that adds an async wait handler for the window.setInterval function.
     */
    (function () {
        var intervals = {};
        window.oldSetInterval = window.setInterval;
        window.setInterval = function (fn, time) {
            jasmineui.log("setInterval called");
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
            jasmineui.log("clearInterval called");
            window.oldClearInterval(code);
            delete intervals[code];
        };
        // return a function that allows to check
        // if an interval is running...
        jasmineui.addAsyncWaitHandler('interval', function () {
            var count = 0;
            for (var x in intervals) {
                count++;
            }
            return count != 0;
        });
    })();

    /**
     * Adds a loadHtmlListener that adds an async wait handler for the window.XMLHttpRequest.
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

        jasmineui.addAsyncWaitHandler('xhr',
            function () {
                return window.openCallCount != 0;
            });


    })();

    /**
     * Adds a loadHtmlListener that adds an async wait handler for the webkitAnimationStart and webkitAnimationEnd events.
     * Note: The animationStart event is usually fired some time
     * after the animation was added to the css of an element (approx 50ms).
     * So be sure to always wait at least that time!
     */
    (function () {
        jasmineui.addBeforeLoadListener(function () {
            if (!(window.$ && window.$.fn && window.$.fn.animationComplete)) {
                return;
            }
            var oldFn = window.$.fn.animationComplete;
            window.animationCount = 0;
            window.$.fn.animationComplete = function (callback) {
                window.animationCount++;
                return oldFn.call(this, function () {
                    window.animationCount--;
                    return callback.apply(this, arguments);
                });
            };
            jasmineui.addAsyncWaitHandler('WebkitAnimation',
                function () {
                    return window.animationCount != 0;
                });

        });

    })();

    /**
     * Adds a loadHtmlListener that adds an async wait handler for the webkitTransitionStart and webkitTransitionEnd events.
     * Note: The transitionStart event is usually fired some time
     * after the animation was added to the css of an element (approx 50ms).
     * So be sure to always wait at least that time!
     */
    (function () {
        jasmineui.addBeforeLoadListener(function () {
            if (!(window.$ && window.$.fn && window.$.fn.animationComplete)) {
                return;
            }
            window.transitionCount = 0;

            var oldFn = window.$.fn.transitionComplete;
            window.$.fn.transitionComplete = function (callback) {
                window.transitionCount++;
                return oldFn.call(this, function () {
                    window.transitionCount--;
                    return callback.apply(this, arguments);
                });
            };
            jasmineui.addAsyncWaitHandler('WebkitTransition',
                function () {
                    return window.transitionCount != 0;
                });

        });
    })();


    /**
     * Error listener in the opened window to make the spec fail on errors.
     */
    (function () {
        function handleError(event) {
            opener.jasmine.getEnv().currentSpec.fail("Error from testwindow: " + event.message);
        }

        if (window.addEventListener) {
            window.addEventListener('error', handleError, false);
        } else {
            window.attachEvent("onerror", handleError);
        }
    })();

    /**
     * Functions to simulate events.
     * Based upon https://github.com/jquery/jquery-ui/blob/master/tests/jquery.simulate.js
     * Can also handle elements from different frames.
     * <p>
     * Provides:
     * simulate(el, type, options)
     */
    (function () {
        window.simulate = function (el, type, options) {
            options = extend({}, window.simulate.defaults, options || {});
            var document = el.ownerDocument;
            simulateEvent(document, el, type, options);
        };

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

        extend(window.simulate, {
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

    })();
};

if (opener && opener.jasmineui) {
    jasmineui.client();
} else {
    jasmineui.server();
}


