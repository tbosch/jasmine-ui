define('client/asyncWaitClient', ['logger', 'eventListener'], function (logger, eventListener) {
    /**
     * Module for waiting for the end of asynchronous actions.
     */
    var asyncWaitHandlers = {};

    /**
     * Adds a handler to the async wait functionality.
     * A handler is a function that returns whether asynchronous work is going on.
     *
     * @param name
     * @param handler Function that returns true/false.
     */
    function addAsyncWaitHandler(name, handler) {
        asyncWaitHandlers[name] = handler;
    }

    function isWaitForAsync() {
        var handlers = asyncWaitHandlers;
        for (var name in handlers) {
            if (handlers[name]()) {
                logger.log("async waiting for " + name);
                return true;
            }
        }
        if (window.jQuery) {
            if (!window.jQuery.isReady) {
                logger.log("async waiting for jquery ready");
                return true;
            }
        }
        logger.log("end waiting for async");
        return false;
    }

    /**
     * Adds an async wait handler for the load event
     */
    var loadListeners = [];
    (function () {
        var loadEventFired = false;
        addAsyncWaitHandler('loading', function () {
            return !loadEventFired;
        });

        eventListener.addBeforeLoadListener(function () {
            loadEventFired = true;
        });
    })();

    /**
     * Adds an async wait handler for the window.setTimeout function.
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
        addAsyncWaitHandler('timeout', function () {
            var count = 0;
            for (var x in timeouts) {
                count++;
            }
            return count != 0;
        });
    })();

    /**
     * Adds an async wait handler for the window.setInterval function.
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
        addAsyncWaitHandler('interval', function () {
            var count = 0;
            for (var x in intervals) {
                count++;
            }
            return count != 0;
        });
    })();

    /**
     * Adds an async wait handler for the window.XMLHttpRequest.
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

        addAsyncWaitHandler('xhr',
            function () {
                return window.openCallCount != 0;
            });
    })();

    /**
     * Adds an async wait handler for the webkitAnimationStart and webkitAnimationEnd events.
     * Note: The animationStart event is usually fired some time
     * after the animation was added to the css of an element (approx 50ms).
     * So be sure to always wait at least that time!
     */
    (function () {
        eventListener.addBeforeLoadListener(function () {
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
            addAsyncWaitHandler('WebkitAnimation',
                function () {
                    return window.animationCount != 0;
                });

        });

    })();

    /**
     * Adds an async wait handler for the webkitTransitionStart and webkitTransitionEnd events.
     * Note: The transitionStart event is usually fired some time
     * after the animation was added to the css of an element (approx 50ms).
     * So be sure to always wait at least that time!
     */
    (function () {
        eventListener.addBeforeLoadListener(function () {
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
            addAsyncWaitHandler('WebkitTransition',
                function () {
                    return window.transitionCount != 0;
                });

        });
    })();

    return {
        isWaitForAsync:isWaitForAsync,
        addAsyncWaitHandler:addAsyncWaitHandler
    }
});