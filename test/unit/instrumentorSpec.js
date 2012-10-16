jasmineui.require(["factory!instrumentor"], function (instrumentorFactory) {
    describe("instrumentor", function () {
        var someScriptUrl = 'someScriptUrl';
        var scriptAccessor, instrumentor, globals;
        beforeEach(function () {
            globals = {
                document:{
                    write:jasmine.createSpy('write')
                },
                jasmineui:{}
            };
            scriptAccessor = {
                currentScriptUrl:jasmine.createSpy('scriptAccessor').andReturn(someScriptUrl)
            };
            instrumentor = instrumentorFactory({
                scriptAccessor:scriptAccessor,
                globals:globals
            });
        });

        function urlScript(url) {
            return '<script type="text/javascript" src="' + url + '"></script>';
        }

        function inlineScript(content) {
            return '<script type="text/javascript">' + content + '</script>';
        }


        describe('loaderScript', function () {
            var win, doc, xhr;

            beforeEach(function () {
                xhr = {
                    open:jasmine.createSpy('open'),
                    send:jasmine.createSpy('send'),
                    responseText:'someText'
                };
                doc = {
                    execCommand:jasmine.createSpy('execCommand'),
                    open:jasmine.createSpy('open'),
                    close:jasmine.createSpy('close'),
                    write:jasmine.createSpy('write')
                };
                win = {
                    location:{
                        href:'someHref'
                    },
                    stop:jasmine.createSpy('stop'),
                    XMLHttpRequest:function () {
                        return xhr;
                    },
                    document:doc
                };
            });

            function execLoader() {
                var script = instrumentor.loaderScript();
                // Used by the eval statement!
                var window = win;
                eval(script);
            }

            describe('stop window load', function () {
                it('should call window.stop if available', function () {
                    execLoader();
                    expect(win.stop).toHaveBeenCalled();
                });
                it('should call document.execCommand if window.stop is not available', function () {
                    delete win.stop;
                    execLoader();
                    expect(doc.execCommand).toHaveBeenCalledWith('Stop');
                });
            });

            describe('document rewrite', function () {
                it('should read the document using xhr', function () {
                    execLoader();
                    expect(xhr.open).toHaveBeenCalledWith('GET', win.location.href, false);
                    expect(xhr.send).toHaveBeenCalled();
                });
                it('should rewrite the document using document.open, document.write and document.close', function () {
                    execLoader();
                    expect(doc.open).toHaveBeenCalled();
                    expect(doc.write).toHaveBeenCalledWith(xhr.responseText);
                    expect(doc.close).toHaveBeenCalled();
                });

                it('should add jasmineuiClient attribute to the html tag', function () {
                    xhr.responseText = '<html>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith('<html data-jasmineui="true">');
                });

                it('should add a script at the end of the body', function () {
                    xhr.responseText = '</body>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith(inlineScript('jasmineui.instrumentor.endScripts()') + inlineScript('jasmineui.instrumentor.endCalls()')+ '</body>');
                });

                it('should replace eval(jasmineui) by the current script url', function () {
                    scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                    xhr.responseText = '<script>eval(sessionStorage.jasmineui)</script>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith(urlScript(someScriptUrl));
                });

                it('should replace inline scripts', function () {
                    var someInlineScript = 'someInline+"a"';
                    xhr.responseText = '<script>' + someInlineScript + '</script>';
                    execLoader();
                    var expectedInlineScript = someInlineScript.replace(/"/g, '\\"');
                    expect(doc.write).toHaveBeenCalledWith(inlineScript('jasmineui.instrumentor.inlineScript("' + expectedInlineScript + '")'));
                });

                it('should replace scripts with urls', function () {
                    var someUrl = 'someUrl';
                    xhr.responseText = '<script src="' + someUrl + '"></script>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith(inlineScript('jasmineui.instrumentor.urlScript("' + someUrl + '")'));
                });
            });


        });

        describe('beginScript', function () {
            it('should add the script using document.write', function () {
                var someUrl = 'someUrl';
                instrumentor.beginScript(someUrl);
                expect(globals.document.write).toHaveBeenCalledWith(urlScript(someUrl));
            });
        });

        describe('no script loader', function () {
            describe('endScript', function () {
                it('should add the script when jasmineui.instrumentor.endScripts() is called', function () {
                    var someUrl = 'someUrl';
                    instrumentor.endScript(someUrl);
                    globals.jasmineui.instrumentor.endScripts();
                    expect(globals.document.write).toHaveBeenCalledWith(urlScript(someUrl));
                });
            });
            describe('endCall', function () {
                it('should call the given function when jasmineui.instrumentor.endCalls() is called', function () {
                    var callback = jasmine.createSpy('callback');
                    instrumentor.endCall(callback);
                    globals.jasmineui.instrumentor.endCalls();
                    expect(callback).toHaveBeenCalled();
                });
            });
        });

        describe('with requirejs', function () {
            var requireCallback, nestedRequire, someModule, originalRequire;
            beforeEach(function () {
                requireCallback = jasmine.createSpy('requireCallback');
                nestedRequire = jasmine.createSpy('nestedRequire');
                someModule = {};
                originalRequire = globals.require = jasmine.createSpy('originalRequire');

            });

            it('should instrument require to do a nested require', function () {
                globals.jasmineui.instrumentor.endScripts();
                globals.require(['someModule'], requireCallback);

                expect(originalRequire).toHaveBeenCalled();
                expect(originalRequire.mostRecentCall.args[0]).toEqual(['someModule', 'require']);
                expect(requireCallback).not.toHaveBeenCalled();

                originalRequire.mostRecentCall.args[1](someModule, nestedRequire);
                expect(nestedRequire).toHaveBeenCalled();
            });

            it('should call the original require callback when the nested callback is called with the original arguments', function () {
                globals.jasmineui.instrumentor.endScripts();
                globals.require(['someModule'], requireCallback);

                originalRequire.mostRecentCall.args[1](someModule, nestedRequire);

                nestedRequire.mostRecentCall.args[1]();
                expect(requireCallback).toHaveBeenCalledWith(someModule);
            });

            describe('endScript', function () {
                it('should not call document.write', function () {
                    var someScriptUrl = "someScriptUrl";
                    instrumentor.endScript(someScriptUrl);
                    globals.jasmineui.instrumentor.endScripts();
                    expect(globals.document.write).not.toHaveBeenCalled();
                });

                it('should add the script to the nested require call', function () {
                    var someScriptUrl = "someScriptUrl";
                    instrumentor.endScript(someScriptUrl);
                    globals.jasmineui.instrumentor.endScripts();

                    globals.require(['someModule'], requireCallback);

                    originalRequire.mostRecentCall.args[1](someModule, nestedRequire);
                    expect(nestedRequire.mostRecentCall.args[0]).toEqual([someScriptUrl]);
                });
            });

            describe('endCall', function () {
                it('should call the callbacks when the nested require call is called', function () {
                    var endCallback = jasmine.createSpy('endCallback');
                    instrumentor.endCall(endCallback);

                    globals.jasmineui.instrumentor.endScripts();
                    globals.require(['someModule'], requireCallback);

                    originalRequire.mostRecentCall.args[1](someModule, nestedRequire);
                    expect(endCallback).not.toHaveBeenCalled();
                    nestedRequire.mostRecentCall.args[1]();
                    expect(endCallback).toHaveBeenCalled();
                });
            });

            // TODO instrumentFunction!
        });

    });
});

