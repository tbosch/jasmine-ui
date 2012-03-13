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

    var loadListeners = [];

    function addLoadListener(listener) {
        // TODO integrate with requirejs!
        window.addEventListener('load', listener, false);
    }

    return {
        addBeforeLoadListener:addBeforeLoadListener,
        loaded:loaded,
        addLoadListener: addLoadListener
    }
});