describe(
        "jasmine.ui.wait",
        function() {
            window.isFrameLoaded = function() {
                return true;
            };

            beforeEach(function() {
                try {
                    delete window.myframe;
                } catch (_) {
                }
                ; // catch needed for IE only
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                var doc = myframe.document;
                doc.open();
                doc.write('<html><head><script src="/jasmine-ui/test/lib/jquery-1.5.1.js"></script></head><body onload="parent.frameloaded = 1;"></body></html>');
                doc.close();
                window.frameloaded = 0;
            });

            it('should instrument timeout only beforeContent', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var mywindow = myframe.window;
                    var finished = jasmine.ui.wait.instrumentTimeout(mywindow,
                            'afterContent');
                    expect(finished).toEqual(null);
                    var finished = jasmine.ui.wait.instrumentTimeout(mywindow,
                            'beforeContent');
                    expect(finished).toBeTruthy();
                });
            });

            it('should detect timeout waiting', function() {
                var mywindow, finished, called;
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    mywindow = myframe.window;
                    finished = jasmine.ui.wait.instrumentTimeout(mywindow,
                            'beforeContent');
                    called = false;
                });
                runs(function() {
                    expect(finished()).toEqual(true);
                    mywindow.setTimeout(function() {
                        called = true;
                    }, 100);
                    expect(finished()).toEqual(false);
                });
                waitsFor(function() {
                    return called;
                }, 2000);
                runs(function() {
                    expect(finished()).toEqual(true);
                });
            });

            it('should detect timeout clearance', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var mywindow = myframe.window;
                    var finished = jasmine.ui.wait.instrumentTimeout(mywindow,
                            "beforeContent");
                    var called = false;
                    expect(finished()).toEqual(true);
                    var handle = mywindow.setTimeout(function() {
                        called = true;
                    }, 5000);
                    expect(finished()).toEqual(false);
                    mywindow.clearTimeout(handle);
                    expect(finished()).toEqual(true);
                });
            });

            it('should instrument interval only beforeContent', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var mywindow = myframe.window;
                    var finished = jasmine.ui.wait.instrumentInterval(mywindow,
                            "afterContent");
                    expect(finished).toEqual(null);
                    var finished = jasmine.ui.wait.instrumentInterval(mywindow,
                            "beforeContent");
                    expect(finished).toBeTruthy();
                });
            });

            it('should detect interval waiting', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var mywindow = myframe.window;
                    var finished = jasmine.ui.wait.instrumentInterval(mywindow,
                            "beforeContent");
                    expect(finished()).toEqual(true);
                    var handle = mywindow.setInterval(function() {
                        called = true;
                    }, 100);
                    expect(finished()).toEqual(false);
                    mywindow.clearInterval(handle);
                    expect(finished()).toEqual(true);
                });
            });

            it('should allow intervals to work', function() {
                var mywindow, finished, called;
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    mywindow = myframe.window;
                    finished = jasmine.ui.wait.instrumentInterval(mywindow,
                            "beforeContent");
                    called = 0;
                });
                runs(function() {
                    expect(finished()).toEqual(true);
                    var handle = mywindow.setInterval(function() {
                        called++;
                        if (called == 4) {
                            mywindow.clearInterval(handle);
                        }
                    }, 100);
                    expect(finished()).toEqual(false);
                });
                waitsFor(function() {
                    return called == 4;
                }, 2000);
                runs(function() {
                    expect(finished()).toEqual(true);
                });
            });

            it('should instrument jQuery only afterContent', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var finished = jasmine.ui.wait.instrumentJQueryAjax(myframe,
                            "beforeContent");
                    expect(finished).toEqual(null);
                    var finished = jasmine.ui.wait.instrumentJQueryAjax(myframe,
                            "afterContent");
                    expect(finished).toBeTruthy();
                });
            });

            it('should detect jquery ajax waiting', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var callback = null;
                    var mockAjax = spyOn(myframe.jQuery, 'ajax').andCallFake(
                            function(url, options) {
                                callback = options.complete;
                            });
                    var finished = jasmine.ui.wait.instrumentJQueryAjax(window.myframe,
                            "afterContent");
                    expect(finished()).toEqual(true);
                    myframe.jQuery.ajax("http://myurl");
                    expect(finished()).toEqual(false);
                    callback();
                    expect(finished()).toEqual(true);
                });
            });

            it('should allow jquery ajax complete callback', function() {
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var callback = null;
                    var mockAjax = spyOn(myframe.jQuery, 'ajax').andCallFake(
                            function(url, options) {
                                callback = options.complete;
                            });
                    var finished = jasmine.ui.wait.instrumentJQueryAjax(myframe);
                    var completeCalled = false;
                    myframe.jQuery.ajax("http://myurl", {
                        complete : function() {
                            completeCalled = true;
                        }
                    });
                    expect(completeCalled).toEqual(false);
                    callback();
                    expect(completeCalled).toEqual(true);
                });
            });

            it('should instrument animation waiting only beforeContent', function() {
                expect(window.myframe).toBeTruthy();
                if (!window.WebKitAnimationEvent) {
                    // This depends on the browser features!
                    return;
                }
                expect(window.myframe).toBeTruthy();
                waitsFor(isFrameLoaded);
                runs(function() {
                    var finished = jasmine.ui.wait.instrumentAnimation(myframe,
                            "beforeContent");
                    expect(finished).toBeTruthy();
                    var finished = jasmine.ui.wait.instrumentAnimation(myframe,
                            "afterContent");
                    expect(finished).toEqual(null);
                });
            });

            it(
                    'should detect animation waiting',
                    function() {
                        var finished, animationEnded;
                        expect(window.myframe).toBeTruthy();
                        if (!window.WebKitAnimationEvent) {
                            // This depends on the browser features!
                            return;
                        }
                        expect(window.myframe).toBeTruthy();
                        waitsFor(isFrameLoaded);
                        runs(function() {
                            finished = jasmine.ui.wait.instrumentAnimation(myframe, 'beforeContent');
                            animationEnded = false;
                            myframe.$("body")
                                    .append(
                                    '<style>@-webkit-keyframes fadein {from { opacity: 0; } to { opacity: 1; }}</style>');
                            myframe.$("body")
                                    .append(
                                    '<div id="anim" style="-webkit-animation-name: \'fadein\';-webkit-animation-duration: 500ms;">hello</div>');
                            var to = myframe.$("#anim");
                            expect(finished()).toEqual(true);
                            myframe.document.addEventListener("webkitAnimationEnd", function() {
                                animationEnded = true;
                            }, false);
                        });
                        waits(50);
                        runs(function() {
                            expect(finished()).toEqual(false);
                        });
                        waitsFor(function() {
                            return animationEnded;
                        }, 2000);
                        runs(function() {
                            expect(finished()).toEqual(true);
                        });
                    });

        });
