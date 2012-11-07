jasmineui.define('instrumentor', ['scriptAccessor', 'globals'], function (scriptAccessor, globals) {

    var jasmineUiScriptUrl = scriptAccessor.currentScriptUrl();

    function loaderScript() {
        var helper = function (window) {
            // Groups:
            // 1. text of all element attributes
            // 2. content of src attribute
            // 3. text content of script element.
            var SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/;

            stopLoad();
            var pageHtml = readDocument();
            pageHtml = modifyHtml(pageHtml);
            replaceDocument(pageHtml);

            function stopLoad() {
                if (window.stop) {
                    window.stop();
                } else {
                    // IE
                    window.document.execCommand('Stop');
                }
            }

            function readDocument() {
                var xhr = new window.XMLHttpRequest();
                xhr.open("GET", window.location.href, false);
                xhr.send();
                return xhr.responseText;
            }

            function replaceDocument(pageHtml) {
                window.document.open();
                window.document.write(pageHtml);
                window.document.close();
            }

            function urlScript(url) {
                return '<script type="text/javascript" src="' + url + '"></script>';
            }

            function inlineScript(content) {
                return '<script type="text/javascript">' + content + '</script>';
            }

            function modifyHtml(pageHtml) {
                pageHtml = pageHtml.replace(/<html/g, '<html data-jasmineui="true"');
                pageHtml = pageHtml.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
                    if (textContent.indexOf('sessionStorage.jasmineui') != -1) {
                        return urlScript('JASMINEUI_SCRIPT_URL');
                    } else if (srcAttribute) {
                        return inlineScript('jasmineui.instrumentor.urlScript("' + srcAttribute + '")');
                    } else {
                        textContent = textContent.replace(/"/g, '\\"');
                        return inlineScript('jasmineui.instrumentor.inlineScript("' + textContent + '")');
                    }
                });
                pageHtml = pageHtml.replace("</body>", inlineScript('jasmineui.instrumentor.endScripts()') +
                    inlineScript('jasmineui.instrumentor.endCalls()')+ '</body>');
                return pageHtml;
            }
        };
        var script = "(" + helper + ")(window) //@ instrumentor.js";
        return script.replace('JASMINEUI_SCRIPT_URL', jasmineUiScriptUrl);
    }

    function urlScriptTemplate(url) {
        return '<script type="text/javascript" src="' + url + '"></script>';
    }

    function beginScript(url) {
        globals.document.write(urlScriptTemplate(url));
    }

    var endScripts = [];
    var endCalls = [];

    function endScript(url) {
        endScripts.push(url);
    }

    function endCall(callback) {
        endCalls.push(callback);
    }

    var originalRequire;

    function checkForRequireJs() {
        if (originalRequire) {
            return true;
        }
        if (globals.require) {
            originalRequire = globals.require;
            globals.require = function (deps, originalCallback) {
                deps.push('require');
                originalRequire(deps, function () {
                    var originalArgs = Array.prototype.slice.call(arguments);
                    var localRequire = originalArgs[originalArgs.length - 1];
                    localRequire(endScripts, function () {
                        for (i = 0; i < endCalls.length; i++) {
                            endCalls[i]();
                        }
                        originalCallback.apply(globals, originalArgs.slice(0, originalArgs.length - 1));
                    });
                });
            };
            return true;
        }
    }

    function instrumentFunction() {

    }

    function onInlineScript(evalString) {
        checkForRequireJs();
    }

    function onUrlScript(url) {
        checkForRequireJs();
    }

    function onEndScripts() {
        if (checkForRequireJs()) {
            return
        }

        var i;
        for (i = 0; i < endScripts.length; i++) {
            globals.document.write(urlScriptTemplate(endScripts[i]));
        }
    }

    function onEndCalls() {
        if (checkForRequireJs()) {
            return
        }

        var i;
        for (i = 0; i < endCalls.length; i++) {
            endCalls[i]();
        }
    }

    // public API
    return {
        globals: {
            jasmineui: {
                // private API as callback from loaderScript
                instrumentor: {
                    endScripts:onEndScripts,
                    endCalls:onEndCalls,
                    inlineScript:onInlineScript,
                    urlScript:onUrlScript
                }
            }
        },
        loaderScript:loaderScript,
        beginScript:beginScript,
        endScript:endScript,
        endCall:endCall,
        instrumentFunction:instrumentFunction
    }

});