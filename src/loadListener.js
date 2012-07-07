jasmineui.define('loadListener', ['globals'], function (globals) {
    var window = globals.window;
    var document = globals.document;

    var beforeLoadListeners = [];

    /**
     * Adds a listener for the beforeLoad-Event that will be called every time a new url is loaded
     * @param callback
     */
    var addBeforeLoadListener = function (callback) {
        if (beforeLoadListeners.length===0) {
            /**
             * We use a capturing event listener to be the first to get the event.
             * jQuery, ... always use non capturing event listeners...
             */
            document.addEventListener('DOMContentLoaded', beforeLoadCallback, true);
        }
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

    function beforeLoadCallback() {
        if (requirejs.isWaiting()) {
            requirejs.executeBeforeReady(callBeforeLoadListeners);
        } else if (jquery.isWaiting()) {
            jquery.executeBeforeReady(callBeforeLoadListeners);
        } else {
            callBeforeLoadListeners();
        }
    }

    function loaded() {
        return document.readyState == 'complete' && !requirejs.isWaiting() && !jquery.isWaiting();
    }

    function isEmptyObj(obj, ignoreKey) {
        for (var x in obj) {
            if (x!==ignoreKey) {
                return false;
            }
        }
        return true;
    }

    var jquery = {
        isWaiting: function() {
            // Note: We only wait for extra waiting due to calls to holdReady,
            // not for the normal DOMContentLoaded event handling of jQuery.
            // Reason: For the normal DOMContentLoaded handling in jQuery we cannot
            // install an interceptor resp. we already have an interceptor for that DOM event!
            if (globals.jQuery) {
                if (globals.jQuery.readyWait>=2) {
                    return true;
                }
                if (globals.jQuery.isReady && globals.jQuery.readyWait >= 1) {
                    return true;
                }
            }
            return false;
        },
        executeBeforeReady: function(callback) {
            var _ready = globals.jQuery.ready;
            globals.jQuery.ready = function() {
                // Note: This is the border that makes isWaiting() false!
                if (globals.jQuery.readyWait===1 && globals.jQuery.isReady || globals.jQuery.readyWait===2 && !globals.jQuery.isReady) {
                    callback();
                }
                return _ready.apply(this, arguments);
            }
        }
    };

    var requirejs = {
        isWaiting: function(ignoreModId) {
            if (globals.require && globals.require.s) {
                var contexts = globals.require.s.contexts;
                for (var ctxName in contexts) {
                    if (!isEmptyObj(contexts[ctxName].registry, ignoreModId)) {
                        return true;
                    }
                }
            }
            return false;
        },
        executeBeforeReady: function(callback) {
            var contexts = globals.require.s.contexts;
            for (var ctxName in contexts) {
                instrumentRequireJsContext(contexts[ctxName]);
            }

            function instrumentRequireJsContext(context) {
                var _execCb = context.execCb;
                context.execCb = function(modId) {
                    if (!requirejs.isWaiting(modId)) {
                        if (jquery.isWaiting()) {
                            jquery.executeBeforeReady(callback);
                        } else {
                            callback();
                        }
                    }
                    return _execCb.apply(this, arguments);
                }
            }
        }
    };

    var loadListeners = [];

    /**
     * Adds a listener that is called after the load event.
     * @param listener
     */
    function addLoadListener(listener) {
        if (loadListeners.length===0) {
            var loadEventReceived = false;
            var scriptLoaderReady = false;
            window.addEventListener('load', function(event) {
                loadEventReceived = event;
                fireIfNeeded();
            }, false);
            addBeforeLoadListener(function() {
                scriptLoaderReady = true;
                fireIfNeeded();
            });
            function fireIfNeeded() {
                if (loadEventReceived && scriptLoaderReady) {
                    // Wait another 10ms so all other load listeners of the application that is being tested
                    // have a chance to be called. Also, we want to be after the last module call of the script loader!
                    globals.jasmine.setTimeout(function() {
                        for (var i=0; i<loadListeners.length; i++) {
                            loadListeners[i](loadEventReceived);
                        }
                    },10);
                }
            }
        }
        loadListeners.push(listener);
    }

    return {
        addBeforeLoadListener:addBeforeLoadListener,
        loaded:loaded,
        addLoadListener: addLoadListener
    }
});