jasmineui.require(['factory!describeUiClient', 'factory!persistentData'], function (describeUiClientFactory, persistentDataFactory) {
    describe('describeUiClient', function () {
        var jasmineApi, describeUi, globals, waitsForAsync, loadListener, sessionStorage, location, persistentDataAccessor, persistentData;
        beforeEach(function () {
            location = {
                href:''
            };
            sessionStorage = {};
        });

        function createGlobals(location, sessionStorage) {
            return {
                window:{
                    location:location,
                    sessionStorage:sessionStorage,
                    eval:window.eval,
                    removeEventListener:jasmine.createSpy('removeEventListener'),
                    addEventListener:jasmine.createSpy('addEventListener')
                }
            };
        }

        function simulateUnload() {
            var argsForCall = globals.window.addEventListener.argsForCall;
            for (var i=argsForCall.length-1; i>=0; i--) {
                var args = argsForCall[i];
                if (args[0]==='beforeunload') {
                    args[1]();
                    break;
                }
            }
        }

        function simulateServerLoad(location, sessionStorage) {
            var tmpGlobals = createGlobals(location, sessionStorage);
            return persistentDataFactory({
                globals:tmpGlobals
            })();
        }

        function simulateServerWrite(data) {
            var tmpGlobals = createGlobals(location, sessionStorage);
            if (data) {
                var tmpPersistentData = persistentDataFactory({
                    globals:tmpGlobals
                });
                for (var x in data) {
                    tmpPersistentData()[x] = data[x];
                }
                tmpPersistentData.saveAndNavigateWithReloadTo(tmpGlobals.window, 'someUrl');
                delete tmpGlobals.window.jasmineui.persistent;
            }
        }

        function simulateClientLoad(data) {
            runs(function () {
                jasmineApi = null;
                newJasmineApi(function (instance) {
                    jasmineApi = instance;
                });
            });
            waitsFor(function () {
                return jasmineApi;
            });
            runs(function () {
                if (data) {
                    simulateServerWrite(data);
                }
                globals = createGlobals(location, sessionStorage);
                waitsForAsync = jasmine.createSpy('waitsForAsync');
                loadListener = {
                    addBeforeLoadListener:jasmine.createSpy('addBeforeLoadListener'),
                    addLoadListener:jasmine.createSpy('addLoadListener')
                };
                persistentDataAccessor = persistentDataFactory({
                    globals:globals
                });
                describeUi = describeUiClientFactory({
                    globals:globals,
                    jasmineApi:jasmineApi,
                    waitsForAsync:waitsForAsync,
                    loadListener:loadListener,
                    persistentData: persistentDataAccessor
                });
                persistentData = persistentDataAccessor();
            });
        }

        describe("spec execution", function () {
            beforeEach(function () {
                simulateClientLoad({
                    specs:[
                        {specPath:['someSuite', 'someSpec']}
                    ],
                    specIndex:0,
                    reporterUrl:'someReporterUrl'
                });
            });
            it("should run the current spec from persistentData after the load event", function () {
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', specCallback);
                });
                expect(specCallback).not.toHaveBeenCalled();
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(specCallback).toHaveBeenCalled();
            });
            it("should not run other specs than then current spec after the load event", function () {
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                    jasmineApi.it('someSpec2', specCallback);
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(specCallback).not.toHaveBeenCalled();
            });

            it("should save the spec results into the persistentData", function () {
                var persistentCurrentSpec = persistentData.specs[0];
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        jasmineApi.expect(1).toBe(2);
                    });
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                var results = persistentCurrentSpec.results;
                expect(results.getItems().length).toBe(1);
                var result = results.getItems()[0];
                expect(result.actual).toBe(1);
                expect(result.expected).toBe(2);
                expect(result.passed()).toBe(false);
                expect(result.matcherName).toBe('toBe');
            });

            it("should load the next spec when the current spec is finished", function () {
                persistentData.specs.push({specPath:['someSuite', 'someSpec2'], url:'someNewUrl'});
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                });
                expect(persistentData.specIndex).toBe(0);
                loadListener.addLoadListener.mostRecentCall.args[0]();
                var serverData = simulateServerLoad(location, sessionStorage);
                expect(serverData.specIndex).toBe(1);
                expect(globals.window.location.href).toBe('someNewUrl?juir=2#');
            });

            it("should load the reporter url when the spec is finished and there are no more specs to run", function () {
                persistentData.reporterUrl = 'someRepoterUrl';
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                });
                expect(persistentData.specIndex).toBe(0);
                loadListener.addLoadListener.mostRecentCall.args[0]();
                var serverData = simulateServerLoad(location, sessionStorage);
                expect(serverData.specIndex).toBe(1);
                expect(globals.window.location.href).toBe('someRepoterUrl?juir=2#');
            });

            it("should report the spec results to the opener via setting it's href using the reporterUrl", function () {
                var openerLocation = {
                    href: ''
                };
                globals.opener = {
                    location: openerLocation
                };
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        jasmineApi.expect(1).toBe(2);
                    });
                });
                expect(persistentData.specIndex).toBe(0);
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(persistentData.specIndex).toBe(1);
                var serverData = simulateServerLoad(openerLocation, {});
                expect(openerLocation.href).toBe(persistentData.reporterUrl+'#');
                expect(serverData.specIndex).toBe(1);
                expect(serverData.specs[0].results).toBeTruthy();
                var results = serverData.specs[0].results;
                expect(results.items_.length).toBe(1);
                var result = results.items_[0];
                expect(result.actual).toBe(1);
                expect(result.expected).toBe(2);
                expect(result.passed_).toBe(false);
                expect(result.matcherName).toBe('toBe');
            });
        });

        describe("waitsForAsync integration", function () {
            beforeEach(function () {
                simulateClientLoad({
                    specs:[
                        {specPath:['someSuite', 'someSpec']}
                    ],
                    specIndex:0,
                    reporterUrl:'someReporterUrl'
                });
            });

            it("should call waitsForAsync before the spec ", function () {
                var called = false;
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.beforeEach(function () {
                        called = true;
                        expect(waitsForAsync).toHaveBeenCalled();
                    });
                    jasmineApi.it('someSpec');
                });
                expect(waitsForAsync).not.toHaveBeenCalled();
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(called).toBe(true);
            });

            it("should call waitsForAsync before a runs statement", function () {
                var called = false;
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        waitsForAsync.reset();
                        describeUi.runs(function () {
                            called = true;
                            expect(waitsForAsync).toHaveBeenCalled();
                        });
                    });
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(called).toBe(true);
            });
        });

        describe('multi reload specs before the first reload', function () {
            beforeEach(function () {
                simulateClientLoad({
                    specs:[
                        {specPath:['someSuite', 'someSpec']}
                    ],
                    specIndex:0,
                    reporterUrl:'someReporterUrl'
                });
            });
            it("should wait infinitely after waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.waitsForReload();
                        jasmineApi.runs(callback);
                    });
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe('multi reload specs after the first reload', function () {
            beforeEach(function () {
                simulateClientLoad({
                    specs:[
                        {specPath:['someSuite', 'someSpec']}
                    ],
                    specIndex:0,
                    reporterUrl:'someReporterUrl'
                });
                runs(function () {
                    describeUi.describeUi('someSuite', 'someUrl', function () {
                        jasmineApi.it('someSpec', function () {
                            describeUi.runs(function () {
                                jasmineApi.expect(1).toBe(2);
                                simulateUnload();
                            });
                            describeUi.waitsForReload();

                        });
                    });
                    loadListener.addLoadListener.mostRecentCall.args[0]();
                });
                simulateClientLoad();
            });
            it("should ignore beforeEach even if registered after a spec with waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.waitsForReload();
                    });
                    describeUi.beforeEach(callback);
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(callback).not.toHaveBeenCalled();
            });
            it("should ignore runs, waits, waitsFor before waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                spyOn(jasmineApi, 'waits');
                spyOn(jasmineApi, 'waitsFor');
                spyOn(jasmineApi, 'runs');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.runs(callback);
                        describeUi.waits(100);
                        describeUi.waitsFor(callback);
                        describeUi.waitsForReload();
                    });
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(jasmineApi.runs).not.toHaveBeenCalled();
                expect(jasmineApi.waits).not.toHaveBeenCalled();
                expect(jasmineApi.waitsFor).not.toHaveBeenCalled();
            });

            it("should execute runs, waits, waitsFor after waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                spyOn(jasmineApi, 'waits');
                spyOn(jasmineApi, 'waitsFor');
                spyOn(jasmineApi, 'runs');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.waitsForReload();
                        describeUi.runs(callback);
                        describeUi.waits(100);
                        describeUi.waitsFor(callback);
                    });
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                expect(jasmineApi.runs).toHaveBeenCalled();
                expect(jasmineApi.waits).toHaveBeenCalled();
                expect(jasmineApi.waitsFor).toHaveBeenCalled();
            });

            it("should keep the results from the time before the reload and save them all into the persistentData", function () {
                var persistentCurrentSpec = persistentData.specs[persistentData.specIndex];
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        jasmineApi.expect(2).toBe(3);
                    });
                });
                loadListener.addLoadListener.mostRecentCall.args[0]();
                var results = persistentCurrentSpec.results;
                expect(results.getItems().length).toBe(2);
                var result = results.getItems()[0];
                expect(result.actual).toBe(1);
                expect(result.expected).toBe(2);
                expect(result.passed()).toBe(false);
                expect(result.matcherName).toBe('toBe');
                result = results.getItems()[1];
                expect(result.actual).toBe(2);
                expect(result.expected).toBe(3);
                expect(result.passed()).toBe(false);
                expect(result.matcherName).toBe('toBe');

            });
        });

        describe('beforeLoad handling', function () {
            beforeEach(function () {
                simulateClientLoad({
                    specs:[
                        {specPath:['someParentSuite', 'someSuite', 'someSpec']}
                    ],
                    specIndex:0,
                    reporterUrl:'someReporterUrl'
                });
            });
            it("should execute beforeLoad callbacks in the beforeLoad event that are in one of the suites of the current spec", function () {
                var beforeLoadCallback1 = jasmine.createSpy('beforeLoadCallback1');
                var beforeLoadCallback2 = jasmine.createSpy('beforeLoadCallback2');
                jasmineApi.describe('someParentSuite', function () {
                    describeUi.beforeLoad(beforeLoadCallback1);
                    describeUi.describeUi('someSuite', 'someUrl', function () {
                        describeUi.beforeLoad(beforeLoadCallback2);
                        jasmineApi.it('someSpec');
                    });
                });
                expect(beforeLoadCallback1).not.toHaveBeenCalled();
                expect(beforeLoadCallback2).not.toHaveBeenCalled();
                loadListener.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(beforeLoadCallback1).toHaveBeenCalled();
                expect(beforeLoadCallback2).toHaveBeenCalled();
            });

            it("should not execute beforeLoad callbacks of other suites", function () {
                var beforeLoadCallback = jasmine.createSpy('beforeLoadCallback');
                jasmineApi.describe('someParentSuite', function () {
                    describeUi.describeUi('someSuite', 'someUrl', function () {
                        jasmineApi.it('someSpec');
                    });
                    describeUi.describeUi('someSuite2', 'someUrl', function () {
                        describeUi.beforeLoad(beforeLoadCallback);
                        jasmineApi.it('someSpec');
                    });
                });
                expect(beforeLoadCallback).not.toHaveBeenCalled();
                loadListener.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(beforeLoadCallback).not.toHaveBeenCalled();
            });

            it("should catch errors, save them in the spec result and still execute the other beforeLoad callbacks", function () {
                var persistentCurrentSpec = persistentData.specs[0];
                var beforeLoadCallback1 = jasmine.createSpy('beforeLoadCallback1').andThrow(new Error("someError1"));
                var beforeLoadCallback2 = jasmine.createSpy('beforeLoadCallback2').andThrow(new Error("someError2"));
                jasmineApi.describe('someParentSuite', function () {
                    describeUi.beforeLoad(beforeLoadCallback1);
                    describeUi.describeUi('someSuite', 'someUrl', function () {
                        describeUi.beforeLoad(beforeLoadCallback2);
                        jasmineApi.it('someSpec');
                    });
                });
                expect(beforeLoadCallback1).not.toHaveBeenCalled();
                expect(beforeLoadCallback2).not.toHaveBeenCalled();
                loadListener.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(beforeLoadCallback1).toHaveBeenCalled();
                expect(beforeLoadCallback2).toHaveBeenCalled();
                loadListener.addLoadListener.mostRecentCall.args[0]();
                var results = persistentCurrentSpec.results;
                expect(results.getItems().length).toBe(2);
                var result = results.getItems()[0];
                expect(result.message).toBe("Error: someError1");
                result = results.getItems()[1];
                expect(result.message).toBe("Error: someError2");

            });
        });
    });
});