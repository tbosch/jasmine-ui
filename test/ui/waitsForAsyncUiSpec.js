describeUi("waitsForAsync", "/jasmine-ui/test/ui/jasmine-uiSpec.html", function () {
    it('should detect timeout waiting', function () {
        var called;
        var wait;
        runs(function () {
            wait = jasmineuiclient.isWaitForAsync;
            called = false;
        });
        runs(function () {
            expect(wait()).toEqual(false);
            window.setTimeout(function () {
                called = true;
            }, 100);
            expect(wait()).toEqual(true);
        });
        waitsFor(function () {
            return called;
        }, 5000);
        runs(function () {
            expect(wait()).toEqual(false);
        });
    });

    it('should detect timeout clearance', function () {
        var wait;
        runs(function () {
            wait = jasmineuiclient.isWaitForAsync;
            var called = false;
            expect(wait()).toEqual(false);
            var handle = window.setTimeout(function () {
                called = true;
            }, 5000);
            expect(wait()).toEqual(true);
            window.clearTimeout(handle);
            expect(wait()).toEqual(false);
        });
    });

    it('should detect interval waiting', function () {
        runs(function () {
            var wait = jasmineuiclient.isWaitForAsync;
            expect(wait()).toEqual(false);
            var handle = window.setInterval(function () {
            }, 100);
            expect(wait()).toEqual(true);
            window.clearInterval(handle);
            expect(wait()).toEqual(false);
        });
    });

    it('should allow intervals to work', function () {
        var called;
        var wait;
        runs(function () {
            wait = jasmineuiclient.isWaitForAsync;
            called = 0;
            expect(wait()).toEqual(false);
            var handle = window.setInterval(function () {
                called++;
                if (called == 4) {
                    window.clearInterval(handle);
                }
            }, 100);
            expect(wait()).toEqual(true);
        });
        waitsFor(function () {
            return called == 4;
        }, 5000);
        runs(function () {
            expect(wait()).toEqual(false);
        });
    });

    it('should detect ajax waiting', function () {
        var loaded = false;
        var wait;
        runs(function () {
            wait = jasmineuiclient.isWaitForAsync;
            expect(wait()).toEqual(false);
            window.xhrCall('/jasmine-ui/test/ui/notexistent', function () {
                loaded = true;
            });
            expect(wait()).toEqual(true);
        });
        waitsFor(function () {
            return loaded;
        }, 3000);
        runs(function () {
            expect(wait()).toEqual(false);
        });
    });

    it(
        'should detect jquery animation waiting',
        function () {
            var animationEnded;
            var wait;
            runs(function () {
                wait = jasmineuiclient.isWaitForAsync;
                animationEnded = false;
                var el = $('#anim');
                expect(wait()).toEqual(false);
                el.animationComplete(function () {
                    animationEnded = true;
                });
                expect(wait()).toEqual(true);
            });
            waitsFor(function () {
                return animationEnded;
            }, 2000);
            runs(function () {
                expect(wait()).toEqual(false);
            });
        });
    it(
        'should detect jquery transition waiting',
        function () {
            var transitionComplete;
            var wait;
            runs(function () {
                wait = jasmineuiclient.isWaitForAsync;
                transitionComplete = false;
                expect(wait()).toEqual(false);
                var el = $("#anim");
                el.transitionComplete(function () {
                    transitionComplete = true;
                });
                expect(wait()).toEqual(true);
            });
            waitsFor(function () {
                return transitionComplete;
            }, 3000);
            runs(function () {
                expect(wait()).toEqual(false);
            });
        });
});
