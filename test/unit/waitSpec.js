describe(
        "jasmine.ui.wait",
        function() {
            var myframe = null;

            beforeEach(function() {
                myframe = testframe(true);
                var doc = myframe.document;
                doc.open();
                doc.write('<html><head>');
                doc.writeln('<style>@-webkit-keyframes fadein {from { opacity: 0; } to { opacity: 1; }}');
                doc.writeln('.fadein {-webkit-animation-name: \'fadein\';-webkit-animation-duration: 500ms;}</style>');
                doc.write('</script></head><body><div id="anim"></div></body></html>');
                doc.close();
            });

            it('should instrument timeout only beforeContent', function() {
                expect(myframe).toBeTruthy();
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
                expect(myframe).toBeTruthy();
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
                expect(myframe).toBeTruthy();
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
                expect(myframe).toBeTruthy();
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
                expect(myframe).toBeTruthy();
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
                expect(myframe).toBeTruthy();
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

            it('should instrument xhr only beforeContent', function() {
                expect(myframe).toBeTruthy();
                runs(function() {
                    var finished = jasmine.ui.wait.instrumentXhr(myframe,
                            "beforeContent");
                    expect(finished).toBeTruthy();
                    var finished = jasmine.ui.wait.instrumentXhr(myframe,
                            "afterContent");
                    expect(finished).toEqual(null);
                });
            });

            it('should detect ajax waiting', function() {
                var loaded = false;
                var finished;
                expect(myframe).toBeTruthy();
                runs(function() {
                    finished = jasmine.ui.wait.instrumentXhr(myframe,
                            "beforeContent");
                    expect(finished()).toEqual(true);
                    var xhr = new myframe.XMLHttpRequest();
                    xhr.onreadystatechange = function() {
                        loaded = xhr.readyState==4;
                    }
                    xhr.open('GET', 'http://localhost/dummyfile');
                    xhr.send();

                    expect(finished()).toEqual(false);
                });
                waitsFor(function() {
                    return loaded;
                }, 3000);
                runs(function() {
                    expect(finished()).toEqual(true);
                });
            });

            it('should instrument animation waiting only beforeContent', function() {
                expect(myframe).toBeTruthy();
                if (!window.WebKitAnimationEvent) {
                    // This depends on the browser features!
                    return;
                }
                expect(myframe).toBeTruthy();
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
                        expect(myframe).toBeTruthy();
                        if (!window.WebKitAnimationEvent) {
                            // This depends on the browser features!
                            return;
                        }
                        expect(myframe).toBeTruthy();
                        runs(function() {
                            finished = jasmine.ui.wait.instrumentAnimation(myframe, 'beforeContent');
                            animationEnded = false;
                            var el = myframe.document.getElementById('anim');
                            el.setAttribute("class", 'fadein');
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
                        }, 3000);
                        runs(function() {
                            expect(finished()).toEqual(true);
                        });
                    });

            it(
                    'should ignore marked animations',
                    function() {
                        var finished, animationEnded;
                        expect(myframe).toBeTruthy();
                        if (!window.WebKitAnimationEvent) {
                            // This depends on the browser features!
                            return;
                        }
                        expect(myframe).toBeTruthy();
                        runs(function() {
                            jasmine.ui.ignoreAnimation('fadein');
                            finished = jasmine.ui.wait.instrumentAnimation(myframe, 'beforeContent');
                            animationEnded = false;
                            var el = myframe.document.getElementById('anim');
                            el.setAttribute("class", 'fadein');
                            expect(finished()).toEqual(true);
                            myframe.document.addEventListener("webkitAnimationEnd", function() {
                                animationEnded = true;
                            }, false);
                        });
                        waits(50);
                        runs(function() {
                            expect(finished()).toEqual(true);
                        });
                        waitsFor(function() {
                            return animationEnded;
                        }, 2000);
                        runs(function() {
                            expect(finished()).toEqual(true);
                        });
                    });
        });
