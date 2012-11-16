jasmineui.define('htmlParserFactory', [], function () {
    // Attention: htmlParserFactory will be used in an eval statement,
    // so all dependencies must be contained in this factory!

    function htmlParserFactory() {
        // Groups:
        // 1. text of all element attributes
        // 2. content of src attribute
        // 3. text content of script element.
        var SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/g;

        function replaceScripts(html, callback) {
            return html.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
                var result = callback(srcAttribute, textContent);
                if (result===undefined) {
                    return match;
                }
                return result;
            });
        }

        function convertScriptContentToEvalString(textContent) {
            textContent = textContent.replace(/"/g, '\\"');
            textContent = textContent.replace(/\r/g, '');
            textContent = textContent.replace(/\n/g, '\\\n');
            return '"'+textContent+'"';
        }

        function addAttributeToHtmlTag(pageHtml, attribute) {
            return pageHtml.replace(/<html/g, '<html '+attribute);
        }

        return {
            convertScriptContentToEvalString: convertScriptContentToEvalString,
            replaceScripts:replaceScripts,
            addAttributeToHtmlTag:addAttributeToHtmlTag
        };

    }

    return htmlParserFactory;


});
