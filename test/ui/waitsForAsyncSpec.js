describe("waitsForAsync", function() {
    it('should detect timeout waiting', function() {
        var mywindow, called;
        var wait;
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
            mywindow = jasmineui.testwindow();
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
        }, 5000);
        runs(function() {
            expect(wait()).toEqual(false);
        });
    });

    it('should detect timeout clearance', function() {
        var wait;
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
            var mywindow = jasmineui.testwindow();
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
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
            var mywindow = jasmineui.testwindow();
            expect(wait()).toEqual(false);
            var handle = mywindow.setInterval(function() {
            }, 100);
            expect(wait()).toEqual(true);
            mywindow.clearInterval(handle);
            expect(wait()).toEqual(false);
        });
    });

    it('should allow intervals to work', function() {
        var mywindow, called;
        var wait;
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
            mywindow = jasmineui.testwindow();
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
        }, 5000);
        runs(function() {
            expect(wait()).toEqual(false);
        });
    });

    it('should detect ajax waiting', function() {
        var loaded = false;
        var wait;
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
            expect(wait()).toEqual(false);
            var fr = jasmineui.testwindow();
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
            var animationEnded;
            var wait;
            jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
            runs(function() {
                wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
                animationEnded = false;
                var $ = jasmineui.testwindow().$;
                var el = $('#anim');
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
            var transitionComplete;
            var wait;
            jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
            runs(function() {
                wait = jasmineui.testwindow().jasmineui.isWaitForAsync;
                transitionComplete = false;
                var $ = jasmineui.testwindow().$;
                expect(wait()).toEqual(false);
                var el = $("#anim");
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
