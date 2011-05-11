describe("history", function() {
    function getBaseFileName(fr) {
        var baseTags = fr.document.getElementsByTagName('base');
        expect(baseTags.length).toEqual(1);
        var baseHref = baseTags[0].href;
        var lastSlash = baseHref.lastIndexOf('/');
        return baseHref.substring(lastSlash+1);
    }

    function normHash(hash) {
        var hashPos = hash.indexOf('#');
        if (hashPos!=-1) {
            return hash.substring(hashPos+1);
        } else {
            return "";
        }
    }

    it('should allow history to work with hashes', function() {
        var changed = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            expect(normHash(fr.location.hash)).toEqual("");
            fr.location.href += "#test1";
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(normHash(fr.location.hash)).toEqual("test1");
            fr.history.back();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(normHash(fr.location.hash)).toEqual("");
            // should be ignored as we are at the beginning...
            fr.history.back();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(normHash(fr.location.hash)).toEqual("");
            fr.history.forward();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(normHash(fr.location.hash)).toEqual("test1");
            fr.history.forward();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(normHash(fr.location.hash)).toEqual("test1");
        });
    });

    it('should allow history to work with page reloads', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var loc = fr.location;
            fr.location.href = loc.protocol+"//"+loc.host+"/jasmine-ui/test/ui/jasmine-uiSpec2.html";
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec2.html');
            fr.history.back();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec.html');
            // should be ignored as we are at the beginning...
            fr.history.back();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec.html');
            fr.history.forward();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec2.html');
            fr.history.forward();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec2.html');
        });
    });

});
