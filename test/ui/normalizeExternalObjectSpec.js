describe("normalizeExternalObject", function() {
    var fr;
    function initFrameIfNeeded() {
        runs(function() {
            if (!fr) {
                loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
                fr = testframe();
            }
        })
    }

    it('should normalize arrays by creating a new instance in the other window', function() {
        initFrameIfNeeded();
        runs(function() {
            var fr = testframe();
            var l = [1,2,3];
            expect(l instanceof window.Array).toBeTruthy();
            var l2 = jasmine.ui.normalizeExternalObject(l, fr);
            expect(l).not.toBe(l2);
            expect(l2 instanceof window.Array).toBeFalsy();
            expect(l2 instanceof fr.Array).toBeTruthy();
            expect(l2.length).toEqual(3);
            for (var i=0; i<3; i++) {
                expect(l[i]).toEqual(l2[i]);
            }
        });
    });

    it('should not change non array fields in objects', function() {
        initFrameIfNeeded();
        runs(function() {
            var fr = testframe();
            var s = "test";
            var x = {y:{z:true}, x:true, a: s};
            var x2 = jasmine.ui.normalizeExternalObject(x, fr);
            expect(x).toBe(x2);
            expect(x.x).toBeTruthy();
            expect(x.y.z).toBeTruthy();
            expect(x.a).toBe(s);

        });
    });

    it('should clone array fields in objects', function() {
        initFrameIfNeeded();
        runs(function() {
            var fr = testframe();
            var x = {l: [1,2,3]};
            jasmine.ui.normalizeExternalObject(x, fr);
            expect(x.l instanceof fr.Array).toBeTruthy();
            expect(x.l.length).toEqual(3);

        });
    });

});
