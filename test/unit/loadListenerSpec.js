jasmineui.require(['factory!loadListener'], function (loadLlistenerFactory) {
    describe('loadEventSupport', function () {
        var loadEventSupport, globals;
        beforeEach(function () {
            globals = {
                document:{
                    addEventListener:jasmine.createSpy('addEventListener')
                },
                window:{
                    addEventListener:jasmine.createSpy('addEventListener')

                }
            };
            loadEventSupport = loadLlistenerFactory({globals:globals});
        });

        describe('addBeforeLoadListener', function () {
            describe('without requireJs', function () {
                var listener;
                beforeEach(function () {
                    listener = jasmine.createSpy('listener');
                    loadEventSupport.addBeforeLoadListener(listener);
                });
                it("should add a capturing listener to the DOMContentLoaded event", function () {
                    var f = globals.document.addEventListener;
                    expect(f).toHaveBeenCalled();
                    expect(f.mostRecentCall.args[0]).toBe('DOMContentLoaded');
                    expect(f.mostRecentCall.args[2]).toBe(true);
                });

                it("should call the listener when the DOMContentLoaded fires", function () {
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).toHaveBeenCalled();
                });
            });
            describe('with requireJs', function () {
                var listener;
                beforeEach(function () {
                    globals.require = function () {
                    };
                    listener = jasmine.createSpy('listener');
                    loadEventSupport.addBeforeLoadListener(listener);
                });
                it("should call the listener when the DOMContentLoaded fires and requireJs is ready", function () {
                    globals.require.resourcesDone = true;
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).toHaveBeenCalled();
                });

                it("should not call the listener until requireJs is ready", function () {
                    globals.require.resourcesDone = false;
                    var originalResourcesReady = jasmine.createSpy('resourcesReady');
                    globals.require.resourcesReady = originalResourcesReady;
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).not.toHaveBeenCalled();
                    globals.require.resourcesReady(true);
                    expect(listener).toHaveBeenCalled();
                    expect(originalResourcesReady).toHaveBeenCalled();
                });
            });
        });

        describe('addLoadListener', function () {
            describe('without requireJs', function () {
                var listener;
                beforeEach(function () {
                    listener = jasmine.createSpy('listener');
                    loadEventSupport.addLoadListener(listener);
                });
                it("should add a non capturing listener to the load event", function () {
                    var f = globals.window.addEventListener;
                    expect(f).toHaveBeenCalled();
                    expect(f.mostRecentCall.args[0]).toBe('load');
                    expect(f.mostRecentCall.args[2]).toBe(false);
                });

                it("should call the listener when the load event fires", function () {
                    globals.window.addEventListener.mostRecentCall.args[1]();
                    expect(listener).toHaveBeenCalled();
                });
            });
        });


        describe('loaded', function () {
            describe('without requirejs', function () {
                it("should return false when the document readyState is not complete", function () {
                    globals.document.readyState = null;
                    expect(loadEventSupport.loaded()).toBe(false);
                });
                it("should return true when the document readyState is complete", function () {
                    globals.document.readyState = "complete";
                    expect(loadEventSupport.loaded()).toBe(true);
                });
            });
            describe('with requirejs', function () {
                beforeEach(function () {
                    globals.require = function () {
                    };
                    globals.document.readyState = "complete";
                });
                it("should return false when requirejs is not ready", function () {
                    globals.require.resourcesDone = false;
                    expect(loadEventSupport.loaded()).toBe(false);
                });
                it("should return true when the document readyState is complete", function () {
                    globals.require.resourcesDone = true;
                    expect(loadEventSupport.loaded()).toBe(true);
                });
            });
        });


    });
});