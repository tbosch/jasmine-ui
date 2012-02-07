describe('parent', function() {
    describe("some normal test", function() {
        it("should run local tests", function() {
            runs(function() {
                console.log("hello");
            });
        });
    });
    describeUi('myPage', '/jasmine-ui/test/ui/simple-fixture.html', function() {
        beforeEach(function() {
            runs(function() {
                console.log("before Each called");
            });
        });
        it("should do something in the testwindow", function() {
            runs(function() {
                $("body").append("<div>Hello world!</div>");
            });
        });
    });
});