jasmineui.define('instrumentor', ['scriptAccessor', 'globals'], function (scriptAccessor, globals) {

    var jasmineUiScriptUrl = scriptAccessor.currentScriptUrl();

    function loaderScript() {
        var helper = function (window) {
            // Groups:
            // 1. text of all element attributes
            // 2. content of src attribute
            // 3. text content of script element.
            var SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/g;

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
                pageHtml = pageHtml.replace("<html", '<html data-jasmineui="true"');
                pageHtml = pageHtml.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
                    if (textContent.indexOf('sessionStorage.jasmineui') != -1) {
                        return urlScript('JASMINEUI_SCRIPT_URL');
                    } else if (srcAttribute) {
                        return inlineScript('jasmineui.instrumentor.onUrlScript("' + srcAttribute + '")');
                    } else {
                        textContent = textContent.replace(/"/g, '\\"');
                        textContent = textContent.replace(/\r/g, '');
                        textContent = textContent.replace(/\n/g, '\\\n');
                        return inlineScript('jasmineui.instrumentor.onInlineScript("' + textContent + '")');
                    }
                });
                pageHtml = pageHtml.replace("</body>", inlineScript('jasmineui.instrumentor.onEndScripts()') +
                    inlineScript('jasmineui.instrumentor.onEndCalls()')+ '</body>');
                return pageHtml;
            }
        };
        var script = "(" + helper + ")(window) //@ instrumentor.js";
        return script.replace('JASMINEUI_SCRIPT_URL', jasmineUiScriptUrl);
    }

    var endScripts = [];
    var endCalls = [];

    function beginScript(url) {
        writeUrlScript(url);
    }

    function endScript(url) {
        endScripts.push(url);
    }

    function endCall(callback) {
        endCalls.push(callback);
    }

    function onInlineScript(evalString) {
        checkForRequireJs();
        evalScriptContent(evalString);
    }

    function onUrlScript(url) {
        checkForRequireJs();
        if (isUrlInstrumented(url)) {
            loadAndEval(url, function() {
            }, function(error) {
                throw error;
            });
        } else {
            writeUrlScript(url);
        }
    }

    function onEndScripts() {
        if (checkForRequireJs()) {
            return
        }
        var i;
        for (i = 0; i < endScripts.length; i++) {
            writeUrlScript(endScripts[i]);
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

    // ------------- helper functions ---------
    function writeUrlScript(url) {
        globals.document.write('<script type="text/javascript" src="' + url + '"></script>');
    }

    var originalRequire;

    function checkForRequireJs() {
        if (originalRequire) {
            return true;
        }
        if (!globals.require) {
            return false;
        }
        originalRequire = globals.require;
        globals.require = function (deps, originalCallback) {
            deps.push('require');
            originalRequire(deps, function () {
                var originalArgs = Array.prototype.slice.call(arguments);
                var localRequire = originalArgs[originalArgs.length - 1];
                localRequire(endScripts, function () {
                    var i;
                    for (i = 0; i < endCalls.length; i++) {
                        endCalls[i]();
                    }
                    originalCallback.apply(globals, originalArgs.slice(0, originalArgs.length - 1));
                });
            });
        };
        var _load = originalRequire.load;
        originalRequire.load = function (context, moduleName, url) {
            if (!isUrlInstrumented(url)) {
                return _load.apply(this, arguments);
            }
            loadAndEval(url, function () {
                context.completeLoad(moduleName);
            }, function (error) {
                //Set error on module, so it skips timeout checks.
                context.registry[moduleName].error = true;
                throw error;
            });
        };

        return true;
    }

    function loadAndEval(url, onload, onerror) {
        var xhr = new globals.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    evalScriptContent(xhr.responseText + "//@ sourceURL=" + url);
                    onload();
                } else {
                    onerror(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    var instrumentUrlPatterns = [];
    function isUrlInstrumented(url) {
        var i, re;
        var patterns = instrumentUrlPatterns;
        for (i=0; i<patterns.length; i++) {
            re = new RegExp(patterns[i]);
            if (url.match(re)) {
                return true;
            }
        }
        return false;
    }

    function setInstrumentUrlPatterns(patterns) {
        instrumentUrlPatterns = patterns;
    }


    // group 1: name of function
    var FUNCTION_REGEX = /function\s*([^\s\(]+)[^{]*{/g;

    function evalScriptContent(scriptContent) {
        scriptContent = scriptContent.replace(FUNCTION_REGEX, function(all, fnName) {
            if (instrumentedFunctions[fnName]) {
                return all+'if (!'+fnName+'.delegate)return jasmineui.instrumentor.onFunctionCall("'+fnName+'", '+fnName+', this, arguments);';
            }
            return all;
        });
        globals.eval.call(globals, scriptContent);
    }

    function onFunctionCall(fnName, fn, self, args) {
        fn.delegate = true;
        try {
            return instrumentedFunctions[fnName].call(globals, fnName, fn, self, args);
        } finally {
            fn.delegate = false;
        }
    }

    var instrumentedFunctions = {};
    function instrumentFunction(name, callback) {
        instrumentedFunctions[name] = callback;
    }


    // public API
    return {
        globals: {
            jasmineui: {
                // private API as callback from loaderScript
                instrumentor: {
                    onEndScripts:onEndScripts,
                    onEndCalls:onEndCalls,
                    onInlineScript:onInlineScript,
                    onUrlScript:onUrlScript,
                    onFunctionCall:onFunctionCall
                },
                instrumentFunction: instrumentFunction
            }
        },
        loaderScript:loaderScript,
        beginScript:beginScript,
        endScript:endScript,
        endCall:endCall,
        setInstrumentUrlPatterns:setInstrumentUrlPatterns
    }

});