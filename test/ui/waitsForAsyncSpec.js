describe("waitsForAsync", function() {
    it('should detect timeout waiting', function() {
        var mywindow, called;
        var wait = jasmine.ui.isWaitForAsync;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            mywindow = testframe();
            called = false;
        });
        runs(function() {
            expect(wait()).toEqual(false);
            mywindow.setTimeout(function() {
                called = true;
            }, 100);
            expect(wait()).toEqual(true);
        });
        waitsFor(function() {
            return called;
        }, 2000);
        runs(function() {
            expect(wait()).toEqual(false);
        });
    });

    it('should detect timeout clearance', function() {
        var wait = jasmine.ui.isWaitForAsync;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var mywindow = testframe();
            var called = false;
            expect(wait()).toEqual(false);
            var handle = mywindow.setTimeout(function() {
                called = true;
            }, 5000);
            expect(wait()).toEqual(true);
            mywindow.clearTimeout(handle);
            expect(wait()).toEqual(false);
        });
    });

    it('should detect interval waiting', function() {
        var wait = jasmine.ui.isWaitForAsync;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var mywindow = testframe();
            expect(wait()).toEqual(false);
            var handle = mywindow.setInterval(function() {
                called = true;
            }, 100);
            expect(wait()).toEqual(true);
            mywindow.clearInterval(handle);
            expect(wait()).toEqual(false);
        });
    });

    it('should allow intervals to work', function() {
        var mywindow, called;
        var wait = jasmine.ui.isWaitForAsync;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            mywindow = testframe();
            called = 0;
            expect(wait()).toEqual(false);
            var handle = mywindow.setInterval(function() {
                called++;
                if (called == 4) {
                    mywindow.clearInterval(handle);
                }
            }, 100);
            expect(wait()).toEqual(true);
        });
        waitsFor(function() {
            return called == 4;
        }, 2000);
        runs(function() {
            expect(wait()).toEqual(false);
        });
    });

    it('should detect ajax waiting', function() {
        var loaded = false;
        var wait = jasmine.ui.isWaitForAsync;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function(window) {
        });
        runs(function() {
            expect(wait()).toEqual(false);
            var fr = testframe();
            fr.xhrCall('/jasmine-ui/test/ui/notexistent', function() {
                loaded = true;
            });
            expect(wait()).toEqual(true);
        });
        waitsFor(function() {
            return loaded;
        }, 3000);
        runs(function() {
            expect(wait()).toEqual(false);
        });
    });

    it(
        'should detect jquery animation waiting',
        function() {
            if (!window.WebKitAnimationEvent) {
                // This depends on the browser features!
                return;
            }
            var animationEnded;
            var wait = jasmine.ui.isWaitForAsync;
            loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
            runs(function() {
                animationEnded = false;
                var $ = testframe().$;
                var el = $('#anim');
                el.addClass("fadein");
                expect(wait()).toEqual(false);
                el.animationComplete(function() {
                    animationEnded = true;
                });
                expect(wait()).toEqual(true);
            });
            waitsFor(function() {
                return animationEnded;
            }, 2000);
            runs(function() {
                expect(wait()).toEqual(false);
            });
        });
    it(
        'should detect jquery transition waiting',
        function() {
            if (!window.WebKitTransitionEvent) {
                // This depends on the browser features!
                return;
            }
            var transitionComplete;
            var wait = jasmine.ui.isWaitForAsync;
            loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function(frame) {
                var $ = frame.$;
                $("#anim").addClass('transition');
            });
            waits(500);
            runs(function() {
                transitionComplete = false;
                var $ = testframe().$;
                expect(wait()).toEqual(false);
                var el = $("#anim");
                el.addClass('transitionEnd');
                el.transitionComplete(function() {
                    transitionComplete = true;
                });
                expect(wait()).toEqual(true);
            });
            waitsFor(function() {
                return transitionComplete;
            }, 3000);
            runs(function() {
                expect(wait()).toEqual(false);
            });
        });
});
