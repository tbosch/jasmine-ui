jasmineui.define('asyncSensor', ['globals', 'logger', 'loadListener'], function (globals, logger, loadListener) {
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
            return !loadListener.loaded();
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
        loadListener.addBeforeLoadListener(function () {
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
        loadListener.addBeforeLoadListener(function () {
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
});