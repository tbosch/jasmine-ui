describeUi("errorHandler", "/jasmine-ui/test/ui/jasmine-uiSpec.html", function () {
    it("should fail when an error in the loaded document occurs", function () {
        runs(function () {
            var failSpy = spyOn(opener.jasmine.getEnv().currentSpec, "fail");
            $("body").append("<script>someError()</script>");
            expect(failSpy).toHaveBeenCalled();
        });
    });
});
