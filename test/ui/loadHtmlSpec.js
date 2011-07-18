describe("loadHtml", function() {
    it('should load the page and save it in the frame variable', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = testframe();
            var jQuery = fr.jQuery;
            expect(jQuery.isReady).toBeTruthy();

            expect(fr).toBeDefined();
            expect(fr.$("#div1").length).toEqual(1);
        });
    });

    it('should be able to instrument the page before onload is called', function() {
        var docReadyInInstrument;

        function instrumentHtml(window) {
            var jQuery = window.jQuery;
            docReadyInInstrument = jQuery.isReady;
            spyOn(jQuery, 'ajax').andCallFake(function(url, options) {
                options.success([
                    {name:'entry1'},
                    {name:'entry2'}
                ]);
            });
        }
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", instrumentHtml);

        runs(function() {
            var fr = testframe();
            expect(docReadyInInstrument).toEqual(false);
            var jQuery = fr.jQuery;
            expect(jQuery.isReady).toBeTruthy();
            var ajaxData;
            jQuery.ajax("", {success: function(data) {
                ajaxData = data;
            }});
            expect(ajaxData.length).toEqual(2);
        });
    });

});
