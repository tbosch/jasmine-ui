define('eventListener', function () {
    function addEventListener(node, event, callback) {
        if (node.addEventListener) {
            node.addEventListener(event, callback, false);
        } else {
            node.attachEvent("on" + event, callback);
        }
    }

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
        if (window.beforeLoadSupport) {
            return;
        }
        window.beforeLoadSupport = true;

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

        } else if (document.attachEvent) {
            // If IE event model is used
            // Be sure that our handler gets called before any
            // other handler of the instrumented page!
            proxyAddEventFunction(document, 'attachEvent', {'onreadystatechange':loadCallback});
            proxyAddEventFunction(window, 'attachEvent', {'load':loadCallback});
        }
        // A fallback to window.onload, that will always work
        addEventListener(window, 'load', loadCallback);
    }

    addLoadEventListenerToWindow();

    return {
        addEventListener:addEventListener,
        addBeforeLoadListener:addBeforeLoadListener
    }
});