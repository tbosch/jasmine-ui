jasmineui.require(['factory!describeUiServer', 'factory!persistentData'], function (describeUiServerFactory, persistentDataFactory) {
    describe('describeUiServer', function () {
        var jasmineApi, describeUi, globals, waitsForAsync, scriptAccessor, sessionStorage, location, persistentDataAccessor, persistentData, jstestdriver;
        beforeEach(function () {
            location = {
                href:''
            };
            sessionStorage = {};
            jstestdriver = undefined;
        });

        function createGlobals(location, sessionStorage) {
            return {
                jstestdriver: jstestdriver,
                window:{
                    location:location,
                    sessionStorage:sessionStorage,
                    eval:window.eval,
                    removeEventListener:jasmine.createSpy('removeEventListener'),
                    addEventListener:jasmine.createSpy('addEventListener'),
                    document: {
                        writeln: jasmine.createSpy('writeln')
                    },
                    open: jasmine.createSpy('open')
                }
            };
        }

        function simulateClientLoad(location, sessionStorage) {
            var tmpGlobals = createGlobals(location, sessionStorage);
            return persistentDataFactory({
                globals:tmpGlobals
            })();
        }

        function simulateClientPostMessage(data) {
            var tmpGlobals = createGlobals(location, sessionStorage);
            var message;
            tmpGlobals.window.postMessage = function(_message) {
                message = _message;
            };
            var tmpPersistentData = persistentDataFactory({
                globals:tmpGlobals
            });
            tmpGlobals.window.jasmineui = {
                persistent: data
            };
            tmpPersistentData.postDataToWindow(tmpGlobals.window);
            callEventListener(globals, 'message', {data: message});
        }

        function callEventListener(globals, name, event) {
            var argsForCall = globals.window.addEventListener.argsForCall;
            for (var i=argsForCall.length-1; i>=0; i--) {
                var args = argsForCall[i];
                if (args[0]===name) {
                    args[1](event);
                    break;
                }
            }
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
                if (data) {
                    var tmpGlobals = createGlobals(location, sessionStorage);
                    var tmpPersistentData = persistentDataFactory({
                        globals:tmpGlobals
                    });
                    tmpGlobals.window.jasmineui = {
                        persistent: data
                    };
                    tmpPersistentData.saveAndNavigateWithReloadTo(tmpGlobals.window, data.reporterUrl);
                }
                globals = createGlobals(location, sessionStorage);
                waitsForAsync = jasmine.createSpy('waitsForAsync');
                scriptAccessor = {
                    currentScriptUrl:jasmine.createSpy('currentScriptUrl').andReturn('someJasmineUiScriptUrl')
                };
                persistentDataAccessor = persistentDataFactory({
                    globals:globals
                });
                describeUi = describeUiServerFactory({
                    globals:globals,
                    jasmineApi:jasmineApi,
                    scriptAccessor:scriptAccessor,
                    persistentData: persistentDataAccessor
                });
                persistentData = persistentDataAccessor();
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
            it("should save the specs of describeUis to be executed in the current window's location", function() {
                var someScriptUrl = 'someScriptUrl';
                scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                var clientData = simulateClientLoad(location, sessionStorage);
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
                var clientData = simulateClientLoad(location, sessionStorage);
                expect(location.href).toBe('someUrl?juir=1#');
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
                    popup = {
                        location: {
                            href: ''
                        },
                        close: jasmine.createSpy('close')
                    };
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
                expect(globals.window.open).toHaveBeenCalledWith(null, 'jasmineui');
            });
            it("should save the current spec in the popups's location and not change the location of the calling window", function() {
                var runnerUrl = "runnerUrl";
                location.href = runnerUrl;
                var someScriptUrl = 'someScriptUrl';
                scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                expect(location.href).toBe(runnerUrl);
                var clientData = simulateClientLoad(popup.location, {});
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
            it("should continue the execution of an ui spec when the result is given by a message", function() {
                describeUi.describeUi('someSuite', 'someUrl', function() {
                    describeUi.it('someSpec');
                });
                jasmineApi.jasmine.getEnv().execute();
                simulateClientPostMessage({
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
                simulateClientPostMessage({
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
                simulateClientPostMessage({
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
