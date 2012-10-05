(function () {
    if (document.documentElement.getAttribute("aop")) {
        return;
    }
    if (window.stop) {
        window.stop();
    } else {
        // IE
        document.execCommand('Stop');
    }
// Wait, until the document is really stopped,
// so we can overwrite the content using document.open/document.close.
// If we do not wait, the old content stays in the document.
// Note: Checking document.readyState for 'loading' would be great,
// however, FF does not support this.
    window.setTimeout(stopped, 10);
    function stopped() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", location.href, false);
        xhr.send();
        var pageHtml = xhr.responseText;
        pageHtml = pageHtml.replace("<html", '<html aop="true"');
        document.open();
        var scriptRe = /<script[^>]+src\s*=\s*"([^"])[^<]*<\/script>/g;
        // TODO parse all script tags, load them using XHR and replace them
        // with an eval statement!
        // TODO use @ sourceurl
        pageHtml = pageHtml.replace(scriptRe, function(match, url) {
            return '<script>aop.execScriptWithUrl("'+url+'"</script>'
        });
        pageHtml = pageHtml.replace("test2", "test3");
        document.write(pageHtml);
        document.close();
    }
})();
