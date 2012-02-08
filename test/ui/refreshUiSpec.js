describe("page refresh", function() {

    describe('refresh when the exact same page is loaded', function() {
        var data = 0;
        describeUi("describe1", "/jasmine-ui/test/ui/jasmine-uiSpec.html", function() {
            it("execute", function() {
                data++;
            });
        });
        describeUi("describe2", "/jasmine-ui/test/ui/jasmine-uiSpec.html", function() {
            it("execute", function() {
                expect(data).toBe(0);
            });
        });
    });

    describe('refresh the page when the hash changes from empty to something', function() {
        var data = 0;
        describeUi("describe1", "/jasmine-ui/test/ui/jasmine-uiSpec.html", function() {
            it("execute", function() {
                data++;
            });
        });
        describeUi("describe2", "/jasmine-ui/test/ui/jasmine-uiSpec.html#123", function() {
            it("execute", function() {
                expect(data).toBe(0);
            });
        });
    });

    describe('refresh the page when the hash changes from something to something else', function() {
        var data = 0;
        describeUi("describe1", "/jasmine-ui/test/ui/jasmine-uiSpec.html#456", function() {
            it("execute", function() {
                data++;
            });
        });
        describeUi("describe2", "/jasmine-ui/test/ui/jasmine-uiSpec.html#123", function() {
            it("execute", function() {
                expect(data).toBe(0);
            });
        });
    });

    describe('refresh the page when the hash changes from something to nothing', function() {
        var data = 0;
        describeUi("describe1", "/jasmine-ui/test/ui/jasmine-uiSpec.html#123", function() {
            it("execute", function() {
                data++;
            });
        });
        describeUi("describe2", "/jasmine-ui/test/ui/jasmine-uiSpec.html", function() {
            it("execute", function() {
                expect(data).toBe(0);
            });
        });
    });
});
