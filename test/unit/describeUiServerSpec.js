jasmineui.require(['factory!describeUiServer', 'factory!persistentData'], function (describeUiServerFactory, persistentDataFactory) {
    describe('describeUiServer', function () {
        var jasmineApi, describeUi, globals, waitsForAsync, scriptAccessor, sessionStorage, persistentDataAccessor, persistentData, jstestdriver;
        beforeEach(function () {
            sessionStorage = {};
            jstestdriver = undefined;
        });

        function createGlobals(sessionStorage) {
            var res = {
                jstestdriver: jstestdriver,
                window:{
                    location:{
                        href: ''
                    },
                    sessionStorage:sessionStorage,
                    eval:function(string) {
                        // these variables are used by the eval!
                        var window =  res.window;
                        var sessionStorage = res.window.sessionStorage;
                        eval(string);
                    },
                    removeEventListener:jasmine.createSpy('removeEventListener'),
                    addEventListener:jasmine.createSpy('addEventListener'),
                    document: {
                        writeln: jasmine.createSpy('writeln')
                    },
                    open: jasmine.createSpy('open'),
                    close: jasmine.createSpy('close')
                }
            };
            return res;
        }

        function simulateClientLoad(sessionStorage) {
            var tmpGlobals = createGlobals(sessionStorage);
            return persistentDataFactory({
                globals:tmpGlobals
            })();
        }

        function saveDataToWindow(target, data) {
            var tmpGlobals = createGlobals({});
            var tmpPersistentData = persistentDataFactory({
                globals:tmpGlobals
            });
            tmpGlobals.window.jasmineui = {
                persistent: data
            };
            tmpPersistentData.saveDataToWindow(target);
        }

        function simulateClientSaveData(data) {
            saveDataToWindow(globals.window, data);
        }

        function simulateServerLoad(data) {
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
                globals = createGlobals(sessionStorage);
                if (data) {
                    saveDataToWindow(globals.window, data);
                }
                waitsForAsync = jasmine.createSpy('waitsForAsync');
                scriptAccessor = {
                    currentScriptUrl:jasmine.createSpy('currentScriptUrl').andReturn('someJasmineUiScriptUrl')
                };
                var moduleCache = {
                    globals:globals,
                    jasmineApi:jasmineApi,
                    scriptAccessor:scriptAccessor
                };
                persistentDataAccessor = persistentDataFactory(moduleCache);
                persistentData = persistentDataAccessor();
                describeUi = describeUiServerFactory(moduleCache);
            });
        }

        describe('in place mode', function() {
            var reporter;
            beforeEach(function() {
                simulateServerLoad({
                    reporterUrl: 'someReporterUrl'
                });
                runs(function() {
                    reporter = new jasmineApi.jasmine.JsApiReporter();
                    spyOn(reporter, 'reportRunnerResults');
                    spyOn(reporter, 'reportSuiteResults');
                    spyOn(reporter, 'reportSpecResults');
                    jasmineApi.jasmine.getEnv().addReporter(reporter);
                });
            });
            it("should save the specs of describeUis to be executed in the current window's sessionStorage", function() {
                var someScriptUrl = 'someScriptUrl';
                scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                var clientData = simulateClientLoad(sessionStorage);
                expect(clientData.specs.length).toBe(1);
                expect(clientData.specIndex).toBe(0);
                var spec = clientData.specs[0];
                expect(spec.specPath).toEqual(['someSuite', 'someSpec']);
                expect(spec.url).toBe('someUrl');
                expect(spec.loadScripts).toEqual(['someJasmineUiScriptUrl', someScriptUrl]);
            });
            it("should navigate to the url of the first ui spec", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                var clientData = simulateClientLoad(sessionStorage);
                expect(globals.window.location.href).toBe('someUrl?juir=1');
            });
            it("should not call the reporter", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(reporter.reportRunnerResults).not.toHaveBeenCalled();
                expect(reporter.reportSuiteResults).not.toHaveBeenCalled();
                expect(reporter.reportSpecResults).not.toHaveBeenCalled();
            });
            it("should not execute its, beforeEach or afterEachs of describeUis", function() {
                var itCallback = jasmine.createSpy('it');
                var beforeEachCallback = jasmine.createSpy('beforeEach');
                var afterEachCallback = jasmine.createSpy('afterEach');

                describeUi.describeUi('someSuite', 'someUrl', function() {
                    jasmineApi.beforeEach(beforeEachCallback);
                    jasmineApi.afterEach(afterEachCallback);
                    describeUi.it('someSpec', itCallback);
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(itCallback).not.toHaveBeenCalled();
                expect(beforeEachCallback).not.toHaveBeenCalled();
                expect(afterEachCallback).not.toHaveBeenCalled();
            });
            it("should not execute normal describes", function() {
                var itCallback = jasmine.createSpy('it');
                var beforeEachCallback = jasmine.createSpy('beforeEach');
                var afterEachCallback = jasmine.createSpy('afterEach');

                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someUiSpec');
                });
                describeUi.describe('someSuite', function() {
                    jasmineApi.beforeEach(beforeEachCallback);
                    jasmineApi.afterEach(afterEachCallback);
                    describeUi.it('someSpec', itCallback);
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(itCallback).not.toHaveBeenCalled();
                expect(beforeEachCallback).not.toHaveBeenCalled();
                expect(afterEachCallback).not.toHaveBeenCalled();
            });
        });
        describe('results mode', function() {
            var reporter;
            beforeEach(function() {
                simulateServerLoad({
                    reporterUrl: 'someReporterUrl',
                    specs: [{
                        specPath: ['someSuite', 'someSpec'],
                        results: {
                            items_: [
                                {actual: 1, expected: 2, passed_: false, matcherName: 'toBe'}
                            ]
                        }
                    }],
                    specIndex: 1
                });
                runs(function() {
                    reporter = new jasmineApi.jasmine.JsApiReporter();
                    spyOn(reporter, 'reportRunnerResults');
                    spyOn(reporter, 'reportSuiteResults');
                    spyOn(reporter, 'reportSpecResults');
                    jasmineApi.jasmine.getEnv().addReporter(reporter);
                });
            });
            it("should report the results from the client", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(reporter.reportRunnerResults).toHaveBeenCalled();
                expect(reporter.reportSuiteResults).toHaveBeenCalled();
                expect(reporter.reportSpecResults.callCount).toBe(1);
                var spec = reporter.reportSpecResults.mostRecentCall.args[0];
                var results = spec.results();
                expect(results.getItems().length).toBe(1);
                var result = results.getItems()[0];
                expect(result.actual).toBe(1);
                expect(result.expected).toBe(2);
                expect(result.passed()).toBe(false);
                expect(result.matcherName).toBe('toBe');
            });
            it("should not execute its, beforeEach or afterEachs of describeUis", function() {
                var itCallback = jasmine.createSpy('it');
                var beforeEachCallback = jasmine.createSpy('beforeEach');
                var afterEachCallback = jasmine.createSpy('afterEach');

                describeUi.describeUi('someSuite', 'someUrl', function() {
                    jasmineApi.beforeEach(beforeEachCallback);
                    jasmineApi.afterEach(afterEachCallback);
                    describeUi.it('someSpec', itCallback);
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(itCallback).not.toHaveBeenCalled();
                expect(beforeEachCallback).not.toHaveBeenCalled();
                expect(afterEachCallback).not.toHaveBeenCalled();
            });

            it("should execute normal describes", function() {
                var itCallback = jasmine.createSpy('it');
                var beforeEachCallback = jasmine.createSpy('beforeEach');
                var afterEachCallback = jasmine.createSpy('afterEach');

                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someUiSpec');
                });
                describeUi.describe('someSuite', function() {
                    jasmineApi.beforeEach(beforeEachCallback);
                    jasmineApi.afterEach(afterEachCallback);
                    describeUi.it('someSpec', itCallback);
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(itCallback).toHaveBeenCalled();
                expect(beforeEachCallback).toHaveBeenCalled();
                expect(afterEachCallback).toHaveBeenCalled();
            });
        });
        describe('popup mode', function() {
            var popup, reporter;
            beforeEach(function() {
                jstestdriver = true;
                simulateServerLoad({
                    reporterUrl: 'someReporterUrl'
                });
                runs(function() {
                    popup = createGlobals({}).window;
                    globals.window.open.andReturn(popup);
                    reporter = new jasmineApi.jasmine.JsApiReporter();
                    spyOn(reporter, 'reportRunnerResults');
                    spyOn(reporter, 'reportSuiteResults');
                    spyOn(reporter, 'reportSpecResults');
                    jasmineApi.jasmine.getEnv().addReporter(reporter);
                });
            });
            it("should open a popup for a ui spec", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(globals.window.open).toHaveBeenCalledWith('someUrl', 'jasmineui');
            });
            it("should save the current spec in the popups's sessionStorage", function() {
                var someScriptUrl = 'someScriptUrl';
                scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                var clientData = simulateClientLoad(popup.sessionStorage);
                expect(clientData.specs.length).toBe(1);
                expect(clientData.specIndex).toBe(0);
                var spec = clientData.specs[0];
                expect(spec.specPath).toEqual(['someSuite', 'someSpec']);
                expect(spec.url).toBe('someUrl');
                expect(spec.loadScripts).toEqual(['someJasmineUiScriptUrl', someScriptUrl]);
            });
            it("should pause the execution at ui specs", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(reporter.reportRunnerResults).not.toHaveBeenCalled();
            });

            it("should continue the execution of an ui spec when the popup is finished", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                simulateClientSaveData({
                    reporterUrl: 'someReporterUrl',
                    specs: [{
                        specPath: ['someSuite', 'someSpec'],
                        results: {
                            items_: [
                            ]
                        }
                    }],
                    specIndex: 1
                });
                expect(reporter.reportRunnerResults).toHaveBeenCalled();
            });
            it("should close the popup after the ui spec is finished", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                simulateClientSaveData({
                    reporterUrl: 'someReporterUrl',
                    specs: [{
                        specPath: ['someSuite', 'someSpec'],
                        results: {
                            items_: [
                            ]
                        }
                    }],
                    specIndex: 1
                });
                expect(popup.close).toHaveBeenCalled();
            });
            it("should report the results from a hashchange", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                simulateClientSaveData({
                    reporterUrl: 'someReporterUrl',
                    specs: [{
                        specPath: ['someSuite', 'someSpec'],
                        results: {
                            items_: [
                                {actual: 1, expected: 2, passed_: false, matcherName: 'toBe'}
                            ]
                        }
                    }],
                    specIndex: 1
                });
                expect(reporter.reportRunnerResults).toHaveBeenCalled();
                expect(reporter.reportSuiteResults).toHaveBeenCalled();
                expect(reporter.reportSpecResults.callCount).toBe(1);
                var spec = reporter.reportSpecResults.mostRecentCall.args[0];
                var results = spec.results();
                expect(results.getItems().length).toBe(1);
                var result = results.getItems()[0];
                expect(result.actual).toBe(1);
                expect(result.expected).toBe(2);
                expect(result.passed()).toBe(false);
                expect(result.matcherName).toBe('toBe');
            });
            it("should execute normal specs", function() {
                var itCallback = jasmine.createSpy('it');
                jasmineApi.describe('mainSuite', function() {
                    describeUi.it('someNonUiSpec', itCallback);
                    describeUi.describeUi('someSuite', 'someUrl', function() {
                        describeUi.it('someSpec');
                    });
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(reporter.reportSpecResults.callCount).toBe(1);
                var spec = reporter.reportSpecResults.mostRecentCall.args[0];
                expect(spec.description).toBe('someNonUiSpec');
                expect(itCallback).toHaveBeenCalled();
            });
        });

        describe('no describeUis without js-test-driver', function() {
            var reporter;
            beforeEach(function() {
                simulateServerLoad({
                    reporterUrl: 'someReporterUrl'
                });
                runs(function() {
                    reporter = new jasmineApi.jasmine.JsApiReporter();
                    spyOn(reporter, 'reportRunnerResults');
                    spyOn(reporter, 'reportSuiteResults');
                    spyOn(reporter, 'reportSpecResults');
                    jasmineApi.jasmine.getEnv().addReporter(reporter);
                });
            });
            it("should execute normal describes and call the reporter", function() {
                var itCallback = jasmine.createSpy('it');
                var beforeEachCallback = jasmine.createSpy('beforeEach');
                var afterEachCallback = jasmine.createSpy('afterEach');

                describeUi.describe('someSuite', function() {
                    jasmineApi.beforeEach(beforeEachCallback);
                    jasmineApi.afterEach(afterEachCallback);
                    describeUi.it('someSpec', itCallback);
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(itCallback).toHaveBeenCalled();
                expect(beforeEachCallback).toHaveBeenCalled();
                expect(afterEachCallback).toHaveBeenCalled();
                expect(reporter.reportRunnerResults).toHaveBeenCalled();
                expect(reporter.reportSuiteResults).toHaveBeenCalled();
                expect(reporter.reportSpecResults).toHaveBeenCalled();
            });
        });

        describe('no describeUis with js-test-driver', function() {
            var reporter;
            beforeEach(function() {
                jstestdriver = true;
                simulateServerLoad({
                    reporterUrl: 'someReporterUrl'
                });
                runs(function() {
                    reporter = new jasmineApi.jasmine.JsApiReporter();
                    spyOn(reporter, 'reportRunnerResults');
                    spyOn(reporter, 'reportSuiteResults');
                    spyOn(reporter, 'reportSpecResults');
                    jasmineApi.jasmine.getEnv().addReporter(reporter);
                });
            });
            it("should execute normal describes and call the reporter", function() {
                var itCallback = jasmine.createSpy('it');
                var beforeEachCallback = jasmine.createSpy('beforeEach');
                var afterEachCallback = jasmine.createSpy('afterEach');

                describeUi.describe('someSuite', function() {
                    jasmineApi.beforeEach(beforeEachCallback);
                    jasmineApi.afterEach(afterEachCallback);
                    describeUi.it('someSpec', itCallback);
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(itCallback).toHaveBeenCalled();
                expect(beforeEachCallback).toHaveBeenCalled();
                expect(afterEachCallback).toHaveBeenCalled();
                expect(reporter.reportRunnerResults).toHaveBeenCalled();
                expect(reporter.reportSuiteResults).toHaveBeenCalled();
                expect(reporter.reportSpecResults).toHaveBeenCalled();
            });
        });
    });
});
