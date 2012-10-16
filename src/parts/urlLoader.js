jasmineui.define('urlLoader', ['persistentData'], function (persistentData) {
    function parseUrl(url) {
        var hashIndex = url.indexOf('#');
        var hash;
        var query = '';
        if (hashIndex != -1) {
            hash = url.substring(hashIndex + 1);
            url = url.substring(0, hashIndex);
        }
        var queryIndex = url.indexOf('?');
        if (queryIndex != -1) {
            query = url.substring(queryIndex + 1);
            url = url.substring(0, queryIndex);
        }
        return {
            baseUrl:url,
            hash:hash,
            query:query?query.split('&'):[]
        }
    }

    function serializeUrl(parsedUrl) {
        var res = parsedUrl.baseUrl;
        if (parsedUrl.query && parsedUrl.query.length) {
            res += '?' + parsedUrl.query.join('&');
        }
        if (parsedUrl.hash) {
            res += '#' + parsedUrl.hash;
        }
        return res;
    }

    function setOrReplaceQueryAttr(parsedUrl, attr, value) {
        var newQueryEntry = attr + '='+ value;
        var query = parsedUrl.query;
        for (var i = 0; i < query.length; i++) {
            if (query[i].indexOf(attr) === 0) {
                query[i] = newQueryEntry;
                return;
            }
        }
        query.push(newQueryEntry);
    }

    var refreshUrlAttribute = 'juir';

    function navigateWithReloadTo(win, url) {
        var data = persistentData();
        var parsedUrl = parseUrl(url);
        var refreshCount = data.refreshCount = (data.refreshCount || 0) + 1;
        setOrReplaceQueryAttr(parsedUrl, refreshUrlAttribute, refreshCount);
        persistentData.saveDataToWindow(win);
        win.location.href = serializeUrl(parsedUrl);
    }

    return {
        navigateWithReloadTo: navigateWithReloadTo,
        setOrReplaceQueryAttr: setOrReplaceQueryAttr,
        parseUrl: parseUrl,
        serializeUrl: serializeUrl
    };
});