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
                var frame = testframe(true);
                var doc = frame.document;
                doc.open();
                jasmine.ui.fixHashLinksForBaseTag(frame, baseUrl);
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
                return frame;
            }

            function click(link) {
                var doc = link.ownerDocument;
                if (doc.createEvent) {
                    var evt = doc.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, null, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                } else if (doc.createEventObject) {
                    // IE
                    evt = doc.createEventObject();
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
                var frame = writeDocument('', 'test.html');
                expect(frame).toBeTruthy();
                var a = frame.document.getElementById('testlink');
                var loc = frame.location;
                var path = loc.protocol + "//" + loc.host + document.location.pathname;
                expect(a.href).toEqual(baseDir + "test.html");
                click(a);
                expect(a.href).toEqual(baseDir + "test.html");
            });

            it('should change href of hash links when no listener is attached', function() {
                var frame = writeDocument('', '#test');
                expect(frame).toBeTruthy();
                var a = frame.document.getElementById('testlink');
                var loc = frame.location;
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

                var myframe = writeDocument(script, '#test');
                expect(myframe).toBeTruthy();
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
