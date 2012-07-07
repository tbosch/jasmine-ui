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
        if (scriptLoaderIsReady()) {
            callBeforeLoadListeners();
        } else {
            setScriptLoaderBeforeLoadEvent(callBeforeLoadListeners);
        }
        return true;
    }

    function isEmptyObj(obj, ignoreKey) {
        for (var x in obj) {
            if (x!==ignoreKey) {
                return false;
            }
        }
        return true;
    }

    function scriptLoaderIsReady(ignoreModId) {
        if (globals.require) {
            var contexts = globals.require.s.contexts;
            for (var ctxName in contexts) {
                if (!isEmptyObj(contexts[ctxName].registry, ignoreModId)) {
                    return false;
                }
            }
            return true;
        }
        return true;
    }

    function setScriptLoaderBeforeLoadEvent(listener) {
        var contexts = globals.require.s.contexts;
        for (var ctxName in contexts) {
            instrumentRequireJsContext(contexts[ctxName]);
        }

        function instrumentRequireJsContext(context) {
            var _execCb = context.execCb;
            context.execCb = function(modId) {
                if (scriptLoaderIsReady(modId)) {
                    listener();
                }
                return _execCb.apply(this, arguments);
            }
        }
    }


    function loaded() {
        var docReady = document.readyState == 'complete';
        if (docReady) {
            return scriptLoaderIsReady();
        }
        return docReady;
    }

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
                    // Wait another 10ms so all other load listeners of the application that is being tests
                    // have a chance to be called. Also, we want to be after the last module call of the script loader!
                    globals.setTimeout(function() {
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