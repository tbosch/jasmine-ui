describe("history", function() {
    function getFileName(href) {
        var lastSlash = href.lastIndexOf('/');
        return href.substring(lastSlash+1);
    }

    function normHash(hash) {
        var hashPos = hash.indexOf('#');
        if (hashPos!=-1) {
            return hash.substring(hashPos+1);
        } else {
            return hash;
        }
    }

    it('should allow history to work with hashes', function() {
        var changed = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            fr.mark = true;
            expect(normHash(fr.location.hash)).toEqual("");
            fr.location.assign(fr.location.href + "#test1");
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
            // Check that the frame did not reload when an empty hash was assigned!
            expect(fr.mark).toBeTruthy();
            expect(normHash(fr.location.hash)).toEqual("");
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
            fr.location.assign("/jasmine-ui/test/ui/jasmine-uiSpec2.html");
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getFileName(fr.location.href)).toEqual('jasmine-uiSpec2.html');
            fr.history.back();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getFileName(fr.location.href)).toEqual('jasmine-uiSpec.html');
            fr.history.forward();
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getFileName(fr.location.href)).toEqual('jasmine-uiSpec2.html');
        });
    });

});
