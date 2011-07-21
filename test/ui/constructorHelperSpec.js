describe("constructorHelpers", function() {
    var fr;
    function initFrameIfNeeded() {
        runs(function() {
            if (!fr) {
                loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
            }
        });
        runs(function() {
            fr = testframe();
        });
    }

    it('should be able to instantiate an object from another frame', function() {
        initFrameIfNeeded();
        runs(function() {
            var fr = testframe();
            var l = fr.instantiateHelper(fr.Array);
            expect(l instanceof fr.Array).toBeTruthy();
            var l2 = window.instantiateHelper(window.Array);
            expect(l2 instanceof window.Array).toBeTruthy();
        });
    });

    it('should be able to proxy a constructor function from another frame', function() {
        initFrameIfNeeded();
        runs(function() {
            var fr = testframe();
            fr.TestConstructor = fr.proxyConstructor(function(x) {
                this.x = x+1;
            },window);
            expect(fr.newTest(10).x).toEqual(11);
        });
    });
});
