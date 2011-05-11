describe("multi page handling", function() {
    function getBaseFileName(fr) {
        var baseTags = fr.document.getElementsByTagName('base');
        expect(baseTags.length).toEqual(1);
        var baseHref = baseTags[0].href;
        var lastSlash = baseHref.lastIndexOf('/');
        return baseHref.substring(lastSlash+1);
    }

    it('should wait until the next page is fully loaded', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var loc = fr.location;
            fr.location.href = loc.protocol+"//"+loc.host+"/jasmine-ui/test/ui/jasmine-uiSpec2.html";
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(fr.$).toBeTruthy();
            expect(fr.$('#id2').length).toEqual(1);
        });
    });

    it('should instrument the next page', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var loc = fr.location;
            fr.location.href = loc.protocol+"//"+loc.host+"/jasmine-ui/test/ui/jasmine-uiSpec2.html";
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            // the instrumentation creates a base tag. check it...
            var baseTags = fr.document.getElementsByTagName('base');
            expect(baseTags.length).toEqual(1);
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec2.html');
        });
    });
});
