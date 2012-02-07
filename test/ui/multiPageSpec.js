describe("multi page handling", function() {
    function getFileName(href) {
        var lastSlash = href.lastIndexOf('/');
        return href.substring(lastSlash+1);
    }

    it('should wait until the next page is fully loaded', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = jasmineui.testwindow();
            fr.location.assign("/jasmine-ui/test/ui/jasmine-uiSpec2.html");
        });
        jasmineui.waitsForReload();
        runs(function() {
            var fr = jasmineui.testwindow();
            expect(getFileName(fr.location.href)).toEqual('jasmine-uiSpec2.html');
            expect(fr.$).toBeTruthy();
            expect(fr.$('#id2').length).toEqual(1);
        });
    });

    it('should instrument the next page', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = jasmineui.testwindow();
            fr.location.assign("/jasmine-ui/test/ui/jasmine-uiSpec2.html");
        });
        jasmineui.waitsForReload();
        runs(function() {
            var fr = jasmineui.testwindow();
            expect(getFileName(fr.location.href)).toEqual('jasmine-uiSpec2.html');
            var wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
            // check the instrumentation via the waitforAsync flag
            expect(wait()).toEqual(false);
            fr.setTimeout(function() {}, 0);
            expect(wait()).toEqual(true);
        });
    });
});
