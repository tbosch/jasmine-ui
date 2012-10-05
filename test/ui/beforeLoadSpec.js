jasmineui.loadUi('/jasmine-ui/test/ui/jasmine-uiSpec.html', function () {
    describe("beforeLoad and hook functions", function () {
        var state = 0;
        afterEach(function () {
            expect(state).toBe(4);
            state++;
            runs(function () {
                expect(state).toBe(5);
            });
        });
        beforeEach(function () {
            expect(state).toBe(1);
            state++;
            runs(function () {
                expect(state).toBe(2);
                state++;
            });
        });
        beforeLoad(function () {
            expect(state).toBe(0);
            state++;
            expect(document.readyState).not.toBe("complete");
        });
        it("should execute the hook functions in the right order", function () {
            runs(function () {
                expect(state).toBe(3);
                expect(document.readyState).toBe("complete");

                state++;
            });
        });
    });
});
