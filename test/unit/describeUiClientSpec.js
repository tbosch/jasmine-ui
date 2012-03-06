jasmineui.require(['factory!describeUiClient'], function (describeUiClientFactory) {
    describe('describeUiClient', function () {
        var jasmineApi, describeUi, globals, persistentData, waitsForAsync, loadEventSupport, loadUrl;
        var createDescribeUi;
        beforeEach(function () {
            runs(function () {
                newJasmineApi(function (instance) {
                    jasmineApi = instance;
                });
            });
            waitsFor(function () {
                return jasmineApi;
            });
            runs(function () {
                globals = {};
                persistentData = {
                    currentSpec:{},
                    specQueue:[]
                };
                waitsForAsync = jasmine.createSpy('waitsForAsync');
                loadEventSupport = {
                    addBeforeLoadListener:jasmine.createSpy('addBeforeLoadListener'),
                    addLoadListener:jasmine.createSpy('addLoadListener')
                };
                loadUrl = jasmine.createSpy('loadUrl');
                createDescribeUi = function () {
                    describeUi = describeUiClientFactory({
                        globals:globals,
                        jasmineApi:jasmineApi,
                        persistentData:jasmine.createSpy('persistentData').andReturn(persistentData),
                        waitsForAsync:waitsForAsync,
                        loadEventSupport:loadEventSupport,
                        loadUrl:loadUrl
                    });
                };
            });
        });
        afterEach(function () {
            jasmineApi = null;
        });

        describe("spec execution", function () {
            beforeEach(function () {
                createDescribeUi();
            });
            it("should run the current spec from persistentData after the load event", function () {
                persistentData.currentSpec.specPath = ['someSuite', 'someSpec'];
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', specCallback);
                });
                expect(specCallback).not.toHaveBeenCalled();
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(specCallback).toHaveBeenCalled();
            });

            it("should not run other specs than then current spec after the load event", function () {
                persistentData.currentSpec.specPath = ['someSuite', 'someSpec'];
                var d = describeUi.describe;
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                    jasmineApi.it('someSpec2', specCallback);
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(specCallback).not.toHaveBeenCalled();
            });

            it("should save the spec results into the persistentData", function () {
                var persistentCurrentSpec = persistentData.currentSpec;
                persistentCurrentSpec.specPath = ['someSuite', 'someSpec'];
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        jasmineApi.expect(1).toBe(2);
                    });
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                var results = persistentCurrentSpec.results;
                expect(results.getItems().length).toBe(1);
                var result = results.getItems()[0];
                expect(result.actual).toBe(1);
                expect(result.expected).toBe(2);
                expect(result.passed()).toBe(false);
                expect(result.matcherName).toBe('toBe');
            });

        });


        describe("waitsForAsync integration", function () {
            beforeEach(function () {
                persistentData.currentSpec.specPath = ['someSuite', 'someSpec'];
                createDescribeUi();
            });

            it("should call waitsForAsync before the spec ", function () {
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.beforeEach(function () {
                        expect(waitsForAsync).toHaveBeenCalled();
                    });
                    jasmineApi.it('someSpec');
                });
                expect(waitsForAsync).not.toHaveBeenCalled();
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
            });

            it("should call waitsForAsync before a runs statement", function () {
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        waitsForAsync.reset();
                        describeUi.runs(function () {
                            expect(waitsForAsync).toHaveBeenCalled();
                        });
                    });
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
            });
        });

        describe('multi reload specs before the first reload', function () {
            var currentPersistentSpec;
            beforeEach(function () {
                currentPersistentSpec = persistentData.currentSpec;
                currentPersistentSpec.specPath = ['someSuite', 'someSpec'];
                createDescribeUi();
            });
            it("should increment the reloadCount in waitsForReload", function () {
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.runs(function () {
                            expect(currentPersistentSpec.reloadCount).toBeFalsy();
                        });
                        describeUi.waitsForReload();
                    });
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(currentPersistentSpec.reloadCount).toBe(1);
            });
            it("should wait infinitely after waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.waitsForReload();
                        runs(callback);
                    });
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe('multi reload specs after the first reload', function () {
            var currentPersistentSpec;
            beforeEach(function () {
                currentPersistentSpec = persistentData.currentSpec;
                currentPersistentSpec.specPath = ['someSuite', 'someSpec'];
                currentPersistentSpec.reloadCount = 1;
                createDescribeUi();
            });
            it("should ignore beforeEach even if registered after a spec with waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.waitsForReload();
                    });
                    describeUi.beforeEach(callback);
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
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
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
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
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(jasmineApi.runs).toHaveBeenCalled();
                expect(jasmineApi.waits).toHaveBeenCalled();
                expect(jasmineApi.waitsFor).toHaveBeenCalled();
            });

        });
    });

    // TODO beforeLoad
    // - try/catch for every entry!

    // TODO result handling: call opener or use specQueue
});