jasmineui.require(['factory!describeUiClient'], function (describeUiClientFactory) {
    describe('describeUiClient', function () {
        var jasmineApi, describeUi, globals, persistentData, waitsForAsync, loadEventSupport, loadUrl;
        beforeEach(function () {
            persistentData = {
                specs:[],
                specIndex:0
            };
        });
        function createDescribeUi() {
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
                globals = {
                    window:{}
                };
                waitsForAsync = jasmine.createSpy('waitsForAsync');
                loadEventSupport = {
                    addBeforeLoadListener:jasmine.createSpy('addBeforeLoadListener'),
                    addLoadListener:jasmine.createSpy('addLoadListener')
                };
                loadUrl = jasmine.createSpy('loadUrl');
                describeUi = describeUiClientFactory({
                    globals:globals,
                    jasmineApi:jasmineApi,
                    persistentData:jasmine.createSpy('persistentData').andReturn(persistentData),
                    waitsForAsync:waitsForAsync,
                    loadEventSupport:loadEventSupport,
                    loadUrl:loadUrl
                });
            });
        }

        describe("spec execution", function () {
            var persistentCurrentSpec;
            beforeEach(function () {
                persistentCurrentSpec = {specPath:['someSuite', 'someSpec']};
                persistentData.specs.push(persistentCurrentSpec);
                createDescribeUi();
            });
            it("should run the current spec from persistentData after the load event", function () {
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', specCallback);
                });
                expect(specCallback).not.toHaveBeenCalled();
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(specCallback).toHaveBeenCalled();
            });

            it("should not run other specs than then current spec after the load event", function () {
                var specCallback = jasmine.createSpy('specCallback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                    jasmineApi.it('someSpec2', specCallback);
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(specCallback).not.toHaveBeenCalled();
            });

            it("should save the spec results into the persistentData", function () {
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

            it("should load the next spec when the current spec is finished", function () {
                persistentData.specs.push({specPath:['someSuite', 'someSpec2'], url:'someUrl'});
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                });
                expect(persistentData.specIndex).toBe(0);
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(persistentData.specIndex).toBe(1);
                expect(loadUrl).toHaveBeenCalledWith(globals.window, 'someUrl');
            });

            it("should load the reporter url when the spec is finished and there are no more specs to run", function () {
                persistentData.reporterUrl = 'someRepoterUrl';
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec');
                });
                expect(persistentData.specIndex).toBe(0);
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(persistentData.specIndex).toBe(1);
                expect(loadUrl).toHaveBeenCalledWith(globals.window, persistentData.reporterUrl);
            });

            it("should report the spec results to the opener.describeUiServer.setPopupResults", function () {
                var describeUiServer = {
                    setPopupSpecResults:jasmine.createSpy('setPopupSpecResults')
                };
                globals.opener = {
                    jasmineui:{
                        require:jasmine.createSpy('require').andCallFake(function (deps, callback) {
                            callback(describeUiServer);
                        })
                    }
                };
                // persistentData.reporterUrl = 'someRepoterUrl';
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        jasmineApi.expect(1).toBe(2);
                    });
                });
                expect(persistentData.specIndex).toBe(0);
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(persistentData.specIndex).toBe(1);
                var openerRequire = globals.opener.jasmineui.require;
                expect(openerRequire).toHaveBeenCalled();
                expect(openerRequire.mostRecentCall.args[0]).toEqual(['describeUiServer']);
                expect(describeUiServer.setPopupSpecResults).toHaveBeenCalled();
                var reportedResults = describeUiServer.setPopupSpecResults.mostRecentCall.args[0];
                expect(reportedResults.items_.length).toBe(1);
                expect(reportedResults.items_[0].actual).toBe(1);
                expect(reportedResults.items_[0].expected).toBe(2);
            });
        });


        describe("waitsForAsync integration", function () {
            beforeEach(function () {
                persistentData.specs.push({specPath:['someSuite', 'someSpec']});
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
            beforeEach(function () {
                runs(function () {
                    persistentData.specs.push({specPath:['someSuite', 'someSpec']});
                });
                createDescribeUi();
            });
            it("should wait infinitely after waitsForReload", function () {
                var callback = jasmine.createSpy('callback');
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        describeUi.waitsForReload();
                        jasmineApi.runs(callback);
                    });
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                expect(callback).not.toHaveBeenCalled();
            });
        });

        describe('multi reload specs after the first reload', function () {
            beforeEach(function () {
                runs(function () {
                    persistentData.specs.push({specPath:['someSuite', 'someSpec']});
                });
                createDescribeUi();
                runs(function () {
                    describeUi.describeUi('someSuite', 'someUrl', function () {
                        jasmineApi.it('someSpec', function () {
                            describeUi.runs(function () {
                                jasmineApi.expect(1).toBe(2);
                            });
                            describeUi.waitsForReload();
                        });
                    });
                    loadEventSupport.addLoadListener.mostRecentCall.args[0]();
                });
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

            it("should keep the results from the time before the reload and save them all into the persistentData", function () {
                var persistentCurrentSpec = persistentData.specs[persistentData.specIndex];
                describeUi.describeUi('someSuite', 'someUrl', function () {
                    jasmineApi.it('someSpec', function () {
                        jasmineApi.expect(2).toBe(3);
                    });
                });
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
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
            var persistentCurrentSpec;
            beforeEach(function () {
                persistentCurrentSpec = {specPath:['someParentSuite', 'someSuite', 'someSpec']};
                persistentData.specs.push(persistentCurrentSpec);
                createDescribeUi();
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
                loadEventSupport.addBeforeLoadListener.mostRecentCall.args[0]();
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
                loadEventSupport.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(beforeLoadCallback).not.toHaveBeenCalled();
            });

            it("should catch errors, save them in the spec result and still execute the other beforeLoad callbacks", function () {
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
                loadEventSupport.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(beforeLoadCallback1).toHaveBeenCalled();
                expect(beforeLoadCallback2).toHaveBeenCalled();
                loadEventSupport.addLoadListener.mostRecentCall.args[0]();
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