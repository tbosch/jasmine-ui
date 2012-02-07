describe("loadHtml", function() {
    it('should load the page and save it in the testwindow functions', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = jasmineui.testwindow();
            var jQuery = fr.jQuery;
            expect(jQuery.isReady).toBeTruthy();

            expect(fr).toBeDefined();
            expect(fr.$("#div1").length).toEqual(1);
        });
    });

    it('should wait until the page was loaded if another page was loaded before', function() {
        var flag = false;
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function() {
            flag = true;
        });
        runs(function() {
            expect(flag).toBeTruthy();
        });
    });

    it('should refresh the page when the exact same page is loaded', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = jasmineui.testwindow();
            fr.test = true;
        });
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = jasmineui.testwindow();
            expect(fr.test).toBeUndefined();
        });
    });

    it('should refresh the page when the hash changes from empty to something', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = jasmineui.testwindow();
            fr.test = true;
        });
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#123");
        runs(function() {
            var fr = jasmineui.testwindow();
            expect(fr.test).toBeUndefined();
            expect(fr.location.hash).toEqual('#123');
        });
    });

    it('should refresh the page when the hash changes from something to something else', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#456");
        runs(function() {
            var fr = jasmineui.testwindow();
            fr.test = true;
            expect(fr.location.hash).toEqual('#456');
        });
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#123");
        runs(function() {
            var fr = jasmineui.testwindow();
            expect(fr.test).toBeUndefined();
            expect(fr.location.hash).toEqual('#123');
        });
    });

    it('should refresh the page when the hash changes from something to nothing', function() {
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html#456");
        runs(function() {
            var fr = jasmineui.testwindow();
            fr.test = true;
            expect(fr.location.hash).toEqual('#456');
        });
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html");
        runs(function() {
            var fr = jasmineui.testwindow();
            expect(fr.test).toBeUndefined();
            var hash = fr.location.hash.replace(/#/g, '');
            expect(hash).toEqual('');
        });
    });

    it('should be able to instrument the page before onload is called', function() {
        var docReadyInInstrument;

        function instrumentHtml() {
            var jQuery = jasmineui.testwindow().jQuery;
            docReadyInInstrument = jQuery.isReady;
            spyOn(jQuery, 'ajax').andCallFake(function(url, options) {
                options.success([
                    {name:'entry1'},
                    {name:'entry2'}
                ]);
            });
        }
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", instrumentHtml);

        runs(function() {
            var fr = jasmineui.testwindow();
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

        function instrumentHtml() {
            var jQuery = jasmineui.testwindow().jQuery;
            jqueryReadyInInstrument = jQuery.isReady;
        }
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec3.html", instrumentHtml);

        runs(function() {
            var fr = jasmineui.testwindow();
            // This time, the ready function was called by our fake require-js,
            // so jquery was already ready.
            expect(jqueryReadyInInstrument).toEqual(true);
        });
    });

    it("should call the instrumentation listeners only once", function() {
        var callCount = 0;
        function instrumentHtml() {
            callCount++;
        }
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec3.html", instrumentHtml);
        runs(function() {
            expect(callCount).toBe(1);
        });
        jasmineui.loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec3.html");
        runs(function() {
            expect(callCount).toBe(1);
        });
    });
});
