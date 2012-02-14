jasmineui.require(['factory!scriptAccessor'], function (scriptAccessorFactory) {
    describe('scriptAccessor', function () {
        var scriptAccessor, doc;
        beforeEach(function () {
            scriptAccessor = scriptAccessorFactory();
            doc = {
                writeln:jasmine.createSpy('writeln')
            };
        });

        it("should write a script with url", function () {
            var someUrl = 'someUrl';
            scriptAccessor.writeScriptWithUrl(doc, someUrl);
            expect(doc.writeln).toHaveBeenCalledWith('<script type="text/javascript" src="someUrl"></script>');
        });

        it("should write inline scripts", function () {
            var someScript = "doSomething()";
            scriptAccessor.writeInlineScript(doc, someScript);
            expect(doc.writeln).toHaveBeenCalledWith('<script type="text/javascript">doSomething()</script>');
        });


        describe('afterCurrentScript', function () {
            var doc, callback, event;
            beforeEach(function () {
                doc = {
                    addEventListener:jasmine.createSpy('addEventListener'),
                    removeEventListener:jasmine.createSpy('removeEventListener')
                };
                callback = jasmine.createSpy('callback');
                var node = document.createElement('script');
                event = {
                    target:node
                };
                var someUrl = "someUrl";
                event.target.src = someUrl;
            });
            it("should add a capturing event listener", function () {
                scriptAccessor.afterCurrentScript(doc, callback);
                expect(doc.addEventListener).toHaveBeenCalled();
                expect(doc.addEventListener.mostRecentCall.args[0]).toBe('load');
                expect(doc.addEventListener.mostRecentCall.args[2]).toBe(true);
            });
            it("should execute the callback when a load event for a script fires", function () {
                scriptAccessor.afterCurrentScript(doc, callback);
                doc.addEventListener.mostRecentCall.args[1](event);
                expect(callback).toHaveBeenCalledWith(event.target.src);
            });
            it("should not execute the callback when a load event for another node fires", function () {
                event.target = document.createElement('div');
                scriptAccessor.afterCurrentScript(doc, callback);
                doc.addEventListener.mostRecentCall.args[1](event);
                expect(callback).not.toHaveBeenCalled();
            });
            it("should remove the event listener when the the load event occured", function () {
                scriptAccessor.afterCurrentScript(doc, callback);
                doc.addEventListener.mostRecentCall.args[1](event);
                expect(doc.removeEventListener).toHaveBeenCalledWith('load', doc.addEventListener.mostRecentCall.args[1], true);
            });
        });
    });
});
