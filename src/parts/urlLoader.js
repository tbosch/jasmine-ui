jasmineui.define('urlLoader', ['persistentData', 'urlParser'], function (persistentData, urlParser) {


    var refreshUrlAttribute = 'juir';

    function navigateWithReloadTo(win, url) {
        var data = persistentData();
        var parsedUrl = urlParser.parseUrl(url);
        var refreshCount = data.refreshCount = (data.refreshCount || 0) + 1;
        urlParser.setOrReplaceQueryAttr(parsedUrl, refreshUrlAttribute, refreshCount);
        persistentData.saveDataToWindow(win);
        win.location.href = urlParser.serializeUrl(parsedUrl);
    }

    return {
        navigateWithReloadTo: navigateWithReloadTo
    };
});