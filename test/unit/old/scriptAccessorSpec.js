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
    });
});
