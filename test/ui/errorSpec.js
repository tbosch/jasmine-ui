describe("errorHandler", function() {
    it("should fail when an error in the loaded document occurs", function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function(win) {
            var $ = win.$;
            var failSpy = spyOn(jasmine.getEnv().currentSpec, "fail");
            $("body").append("<script>someError()</script>");
            expect(failSpy).toHaveBeenCalled();
        });
    });
});
