describe("loadHtml", function() {
    it('should load the page and save it in the testframe and testwindow functions', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = testframe();
            expect(testwindow()).toBe(fr);
            var jQuery = fr.jQuery;
            expect(jQuery.isReady).toBeTruthy();

            expect(fr).toBeDefined();
            expect(fr.$("#div1").length).toEqual(1);
        });
    });

    it('should wait until the page was loaded if another page was loaded before', function() {
        var flag = false;
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function() {
            flag = true;
        });
        runs(function() {
            expect(flag).toBeTruthy();
        });
    });

    it('should refresh the page when the exact same page is loaded', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = testframe();
            fr.test = true;
        });
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = testframe();
            expect(fr.test).toBeUndefined();
        });
    });

    it('should refresh the page when the hash changes from empty to something', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = testframe();
            fr.test = true;
        });
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#123");
        runs(function() {
            var fr = testframe();
            expect(fr.test).toBeUndefined();
            expect(fr.location.hash).toEqual('#123');
        });
    });

    it('should refresh the page when the hash changes from something to something else', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#456");
        runs(function() {
            var fr = testframe();
            fr.test = true;
            expect(fr.location.hash).toEqual('#456');
        });
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#123");
        runs(function() {
            var fr = testframe();
            expect(fr.test).toBeUndefined();
            expect(fr.location.hash).toEqual('#123');
        });
    });

    it('should refresh the page when the hash changes from something to nothing', function() {
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#456");
        runs(function() {
            var fr = testframe();
            fr.test = true;
            expect(fr.location.hash).toEqual('#456');
        });
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = testframe();
            expect(fr.test).toBeUndefined();
            var hash = fr.location.hash.replace(/#/g, '');
            expect(hash).toEqual('');
        });
    });

    it('should be able to instrument the page at creation', function() {
        var jQueryBeforeCallback, jQueryAfterCallback;

        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function(window) {
            jQueryBeforeCallback = window.jQuery;
        }, function(window) {
            jQueryAfterCallback = window.jQuery;
        });

        runs(function() {
            expect(jQueryBeforeCallback).toBeFalsy();
            expect(jQueryAfterCallback).toBeTruthy();
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

    it('should integration with the wait function of requirejs', function() {
        var jqueryReadyInInstrument = false;

        function instrumentHtml(window) {
            var jQuery = window.jQuery;
            jqueryReadyInInstrument = jQuery.isReady;
        }
        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec3.html", instrumentHtml);

        runs(function() {
            var fr = testframe();
            // This time, the ready function was called by our fake require-js,
            // so jquery was already ready.
            expect(jqueryReadyInInstrument).toEqual(true);
        });
    });
});
