jasmineui.define('utils', function() {

    function isSubList(list, suitePath) {
        var execute = true;
        for (var i = 0; i < suitePath.length; i++) {
            if (i >= list.length || list[i] != suitePath[i]) {
                execute = false;
                break;
            }
        }
        return execute;
    }

    function addWithoutDuplicates(list, entry) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == entry) {
                return;
            }
        }
        list.push(entry);
    }

    function makeAbsoluteUrl(currentScriptUrl, url) {
        if (url.indexOf('://')!=-1) {
            return url;
        }
        if (url.charAt(0) === '/') {
            return url;
        }
        var res = currentScriptUrl;
        var lastSlash = res.lastIndexOf('/');
        return res.substring(0, lastSlash+1)+url;
    }

    return {
        isSubList: isSubList,
        makeAbsoluteUrl: makeAbsoluteUrl,
        addWithoutDuplicates: addWithoutDuplicates
    }

});