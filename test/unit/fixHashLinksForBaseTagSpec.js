describe(
        "fixHashLinksForBaseTag",
        function() {
            var storedObjects = [];
            var baseDir = "http://myhost:1235/myurl/";
            var baseUrl = baseDir + "index.html";

            beforeEach(function() {
            });

            afterEach(function() {
            });


            function writeDocument(script, link) {
                try {
                    // throws an error in IE...
                    delete window.myframe;
                } catch (_) {
                }
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                var doc = myframe.document;
                doc.open();
                jasmine.ui.fixHashLinksForBaseTag(myframe, baseUrl);
                doc.write('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">');
                doc.write('<html>');
                doc.write('<head>');
                doc.write('<base href="');
                doc.write(baseUrl);
                doc.write('">');
                doc.write('<body><a href="' + link + '" id="testlink">Test</a>');
                doc.write('<script>');
                doc.write(script);
                doc.write('</script></body></html>')
                doc.close();

            }

            function click(link) {
                if (myframe.document.createEvent) {
                    var evt = myframe.document.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, null, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                } else if (myframe.document.createEventObject) {
                    // IE
                    evt = myframe.document.createEventObject();
                    evt.type = 'click';
                    evt.button = 1;
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                } else {
                    // IE
                    evt.returnValue = false;
                }
                if (link.dispatchEvent) {
                    link.dispatchEvent(evt);
                } else if (link.fireEvent) {
                    // IE
                    link.fireEvent('on' + evt.type, evt);
                }
            }

            it('should not change href of external links', function() {
                writeDocument('', 'test.html');
                expect(window.myframe).toBeTruthy();
                var a = myframe.document.getElementById('testlink');
                var loc = myframe.location;
                var path = loc.protocol + "//" + loc.host + document.location.pathname;
                expect(a.href).toEqual(baseDir + "test.html");
                click(a);
                expect(a.href).toEqual(baseDir + "test.html");
            });

            it('should change href of hash links when no listener is attached', function() {
                writeDocument('', '#test');
                expect(window.myframe).toBeTruthy();
                var a = myframe.document.getElementById('testlink');
                var loc = myframe.location;
                var path = loc.protocol + "//" + loc.host + document.location.pathname;
                expect(a.href).toEqual(baseUrl + "#test");
                click(a);
                expect(a.href).toEqual(path + "#test");
            });
            it('should change href of hash links when listener with stopPropagation is attached', function() {
                var script = 'var a = document.getElementById("testlink");';
                if (window.addEventListener) {
                    script += 'a.addEventListener("click", function(event) { window.called = true; event.stopPropagation(); }, false);';
                } else if (window.attachEvent) {
                    script += 'a.attachEvent("onclick", function(event) { window.called = true; event.cancelBubble = true; });';
                }

                writeDocument(script, '#test');
                expect(window.myframe).toBeTruthy();
                var a = myframe.document.getElementById('testlink');
                var loc = myframe.location;
                var path = loc.protocol + "//" + loc.host + document.location.pathname;
                expect(a.href).toEqual(baseUrl + "#test");
                click(a);
                expect(myframe.called).toBeTruthy();
                expect(a.href).toEqual(path + "#test");
            });

        })
        ;
