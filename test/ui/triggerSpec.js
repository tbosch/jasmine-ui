describe("trigger", function() {
    function getBaseFileName(fr) {
        var baseTags = fr.document.getElementsByTagName('base');
        expect(baseTags.length).toEqual(1);
        var baseHref = baseTags[0].href;
        var lastSlash = baseHref.lastIndexOf('/');
        return baseHref.substring(lastSlash+1);
    }

    it('should call jquery event listeners', function() {
        var clicked = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var doc = fr.document;
            var div = fr.$("#div1");
            expect(div.length).toEqual(1);
            div.click(function() {
                clicked = true;
            });
            trigger(div[0], 'click');
            expect(clicked).toEqual(true);
        });
    });

    it('should set hashpaths from anchors', function() {
        var clicked = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var doc = fr.document;
            var div = fr.$("#div1");
            expect(div.length).toEqual(1);
            div.html('<a href="#test" id="a1"></a>');
            var a = fr.$("#a1");
            /*div.click(function() {
                clicked = true;
            });*/
            trigger(a[0], 'click');
            expect(fr.location.hash).toEqual("#test");
        });
    });

    it('should not set hashpaths from anchors if default was prevented', function() {
        var clicked = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var doc = fr.document;
            var div = fr.$("#div1");
            expect(div.length).toEqual(1);
            div.html('<a href="#test" id="a1"></a>');
            var a = fr.$("#a1");
            div.click(function(event) {
                event.preventDefault();
            });
            trigger(a[0], 'click');
            expect(fr.location.hash).toEqual("");
        });
    });

    it('should navigate to pages from anchors', function() {
        var clicked = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var doc = fr.document;
            var div = fr.$("#div1");
            expect(div.length).toEqual(1);
            div.html('<a href="jasmine-uiSpec2.html" id="a1"></a>');
            var a = fr.$("#a1");
            /*div.click(function(event) {
                event.preventDefault();
            });
            */
            trigger(a[0], 'click');
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec2.html');
        });
    });

    it('should not navigate to pages from anchors if default was prevented', function() {
        var clicked = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");

        runs(function() {
            var fr = testframe();
            var doc = fr.document;
            var div = fr.$("#div1");
            expect(div.length).toEqual(1);
            div.html('<a href="jasmine-uiSpec2.html" id="a1"></a>');
            var a = fr.$("#a1");
            div.click(function(event) {
                event.preventDefault();
            });
            trigger(a[0], 'click');
        });
        waitsForAsync();
        runs(function() {
            var fr = testframe();
            expect(getBaseFileName(fr)).toEqual('jasmine-uiSpec.html');
        });
    });
});
