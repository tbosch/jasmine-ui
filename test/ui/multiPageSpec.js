describe("multi page handling", function() {
    it('should wait until the next page is fully loaded', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            fr.location.pathname = "/jasmine-ui/test/ui/jasmine-uiSpec2.html";
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
            fr.location.pathname = "/jasmine-ui/test/ui/jasmine-uiSpec2.html";
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            // the instrumentation creates a base tag. check it...
            var baseTags = fr.document.getElementsByTagName('base');
            expect(baseTags.length).toEqual(1);
        });
    });
});
