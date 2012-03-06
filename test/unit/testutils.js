jasmineui.require(['factory!jasmineApi'], function (jasmineApiFactory) {
    var nextFrameId = 0;

    function createJasmineApi(win) {
        return jasmineApiFactory({
            globals:win
        });
    }

    function newJasmineApi(readyCallback) {
        var frameId = 'newJasmineInstanceFrame' + (nextFrameId++);
        var frameElement = document.createElement("iframe");
        frameElement.name = frameId;
        frameElement.style.display = "none";
        document.body.appendChild(frameElement);

        var frame = frames[frameId];
        // prevent asynchronous calls. This makes our tests easier...
        frame.setTimeout = function(callback, time) {
            callback();
        };
        var script = frame.document.createElement("script");
        script.onload = function () {
            readyCallback(createJasmineApi(frame));
        };
        script.type = "text/javascript";
        script.src = "/jasmine-ui/lib/jasmine.js";
        frame.document.head.appendChild(script);
    }

    window.newJasmineApi = newJasmineApi;
});

