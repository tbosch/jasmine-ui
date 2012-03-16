jasmineui.require(['factory!jasmineApi'], function (jasmineApiFactory) {
    var nextFrameId = 0;

    var frameElementsOfLastSpec = [];

    afterEach(function() {
        for (var i=0; i<frameElementsOfLastSpec.length; i++) {
            document.body.removeChild(frameElementsOfLastSpec[i]);
        }
        frameElementsOfLastSpec = [];
    });

    function createJasmineApi(win) {
        return jasmineApiFactory({
            globals:win
        });
    }

    var JASMINE_SCRIPT_RE = /.*jasmine\.js/;

    function jasmineScriptUrl() {
        var scripts = document.getElementsByTagName("script");
        for (var i=0; i<scripts.length; i++) {
            var url = scripts[i].src;
            if (JASMINE_SCRIPT_RE.test(url)) {
                return url;
            }
        }
        throw new Error("Could not find jasmine in the scripts of the current document");
    }

    function newJasmineApi(readyCallback) {
        var frameId = 'newJasmineInstanceFrame' + (nextFrameId++);
        var frameElement = document.createElement("iframe");
        frameElement.name = frameId;
        frameElement.style.display = "none";
        document.body.appendChild(frameElement);
        frameElementsOfLastSpec.push(frameElement);

        var frame = frames[frameId];
        // prevent asynchronous calls. This makes our tests easier...
        frame.setTimeout = function(callback, time) {
            if (time==Infinity) {
                return;
            }
            callback();
        };
        var script = frame.document.createElement("script");
        script.onload = function () {
            readyCallback(createJasmineApi(frame));
        };
        script.type = "text/javascript";
        script.src = jasmineScriptUrl();
        frame.document.head.appendChild(script);

    }

    window.newJasmineApi = newJasmineApi;
});

