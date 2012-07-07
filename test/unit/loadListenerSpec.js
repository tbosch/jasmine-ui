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

                },
                setTimeout: jasmine.createSpy('setTimeout')
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
                var listener, reqContext, execCb;
                beforeEach(function () {
                    execCb = jasmine.createSpy('execCb');
                    reqContext = {
                        execCb: execCb,
                        registry: {
                            someModId: {}
                        }
                    };
                    globals.require = function () {
                    };
                    globals.require.s = {
                        contexts: {
                            '_': reqContext
                        }
                    };
                    listener = jasmine.createSpy('listener');
                    loadEventSupport.addBeforeLoadListener(listener);
                });
                it("should add a capturing event listener for DOMContentLoaded", function() {
                    var f = globals.document.addEventListener;
                    expect(f).toHaveBeenCalled();
                    expect(f.mostRecentCall.args[0]).toBe('DOMContentLoaded');
                    expect(f.mostRecentCall.args[2]).toBe(true);
                });
                it("should wait for the first require to be executed after DOMContentLoaded", function () {
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).not.toHaveBeenCalled();
                    reqContext.execCb('someModId');
                    expect(execCb).toHaveBeenCalledWith('someModId');
                    expect(listener).toHaveBeenCalled();
                });
                it("should wait for the first require to be executed before DOMContentLoaded", function () {
                    expect(listener).not.toHaveBeenCalled();
                    delete reqContext.registry.someModId;
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).toHaveBeenCalled();
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
                it("should add a non capturing listener to the window.load event and a capturing listener to the DOMContentLoaded event", function () {
                    var f = globals.document.addEventListener;
                    expect(f).toHaveBeenCalled();
                    expect(f.mostRecentCall.args[0]).toBe('DOMContentLoaded');
                    expect(f.mostRecentCall.args[2]).toBe(true);

                    f = globals.window.addEventListener;
                    expect(f).toHaveBeenCalled();
                    expect(f.mostRecentCall.args[0]).toBe('load');
                    expect(f.mostRecentCall.args[2]).toBe(false);
                });

                it("should call the listener when the window.load event and the document.DOMContentChanged event fires", function () {
                    var someEvent = {};
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).not.toHaveBeenCalled();
                    globals.window.addEventListener.mostRecentCall.args[1](someEvent);
                    expect(listener).not.toHaveBeenCalled();
                    expect(globals.setTimeout).toHaveBeenCalled();
                    globals.setTimeout.mostRecentCall.args[0]();
                    expect(listener).toHaveBeenCalledWith(someEvent);
                });
            });
            describe('with requireJs', function() {
                var listener, reqContext, execCb;
                beforeEach(function () {
                    execCb = jasmine.createSpy('execCb');
                    reqContext = {
                        execCb: execCb,
                        registry: {
                        }
                    };
                    globals.require = function () {
                    };
                    globals.require.s = {
                        contexts: {
                            '_': reqContext
                        }
                    };
                    listener = jasmine.createSpy('listener');
                    loadEventSupport.addLoadListener(listener);
                });
                it("should call the listener when the window.load event and the document.DOMContentChanged event fires if requirejs is ready", function () {
                    var someEvent = {};
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).not.toHaveBeenCalled();
                    globals.window.addEventListener.mostRecentCall.args[1](someEvent);
                    expect(listener).not.toHaveBeenCalled();
                    expect(globals.setTimeout).toHaveBeenCalled();
                    globals.setTimeout.mostRecentCall.args[0]();
                    expect(listener).toHaveBeenCalledWith(someEvent);
                });
                it("should call the listener not until requirejs is ready", function() {
                    reqContext.registry.someModId = true;

                    var someEvent = {};
                    globals.document.addEventListener.mostRecentCall.args[1]();
                    expect(listener).not.toHaveBeenCalled();
                    globals.window.addEventListener.mostRecentCall.args[1](someEvent);
                    expect(listener).not.toHaveBeenCalled();
                    expect(globals.setTimeout).not.toHaveBeenCalled();

                    reqContext.execCb('someModId');

                    expect(globals.setTimeout).toHaveBeenCalled();
                    globals.setTimeout.mostRecentCall.args[0]();
                    expect(listener).toHaveBeenCalledWith(someEvent);

                });
                // TODO
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
                var reqContext;
                beforeEach(function () {
                    reqContext = {
                        execCb: jasmine.createSpy('execCb'),
                        registry: {
                        }
                    };
                    globals.require = function () {
                    };
                    globals.require.s = {
                        contexts: {
                            '_': reqContext
                        }
                    };
                });
                it("should return false when requirejs is not ready", function () {
                    reqContext.registry = {
                        modId: true
                    };
                    globals.document.readyState = "complete";
                    expect(loadEventSupport.loaded()).toBe(false);
                });
                it("should return false when the document is not ready", function () {
                    reqContext.registry = {};
                    globals.document.readyState = "loading";
                    expect(loadEventSupport.loaded()).toBe(false);
                });
                it("should return true when the document is ready and requirejs is ready", function () {
                    reqContext.registry = {};
                    globals.document.readyState = "complete";
                    expect(loadEventSupport.loaded()).toBe(true);
                });
            });
        });


    });
});