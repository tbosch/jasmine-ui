jasmineui.require(['factory!server/describeUi'], function (describeUiFactory) {
    describe('server/describeUi', function () {
        var describeUi, jasmineApi, callback, waitsForAsync, testwindow, globals, scriptAccessor, loadEventSupport;
        beforeEach(function () {
            globals = {
                jasmineui:{
                    currentScriptUrl:jasmine.createSpy('currentScriptUrl')
                }
            };
            callback = jasmine.createSpy('callback');
            waitsForAsync = jasmine.createSpy('waitsForAsync');
            jasmineApi = {
                describe:jasmine.createSpy('describe'),
                beforeEach:jasmine.createSpy('beforeEach'),
                runs:jasmine.createSpy('runs')
            };
            scriptAccessor = {
                writeScriptWithUrl:jasmine.createSpy('writeScriptWithUrl')
            };
            testwindow = jasmine.createSpy('testwindow');
            loadEventSupport = {
                addBeforeLoadListener:jasmine.createSpy('addBeforeLoadListener')
            };
            describeUi = describeUiFactory({
                'server/jasmineApi':jasmineApi,
                'server/waitsForAsync':waitsForAsync,
                'server/testwindow':testwindow,
                'globals':globals,
                'scriptAccessor':scriptAccessor,
                'remote!client/loadEventSupport':jasmine.createSpy().andReturn(loadEventSupport)
            });
        });
        it("should create a jasmine describe with the same name", function () {
            var someName = 'someName';
            describeUi.describeUi(someName, 'someUrl', callback);
            expect(jasmineApi.describe).toHaveBeenCalled();
            expect(jasmineApi.describe.mostRecentCall.args[0]).toBe(someName);
        });
        it("should create a beforeEach and then call the callback", function () {
            describeUi.describeUi('someName', 'someUrl', callback);
            jasmineApi.describe.mostRecentCall.args[1]();
            expect(jasmineApi.beforeEach).toHaveBeenCalled();
            expect(callback).toHaveBeenCalled();
        });
        it("should create a runs and a waitsForAsync in the beforeEach", function () {
            describeUi.describeUi('someName', 'someUrl', callback);
            jasmineApi.describe.mostRecentCall.args[1]();
            jasmineApi.beforeEach.mostRecentCall.args[0]();
            expect(jasmineApi.runs).toHaveBeenCalled();
            expect(waitsForAsync).toHaveBeenCalled();
        });
        describe('testwindow call', function () {
            it("should open a testwindow with the given url", function () {
                var someUrl = 'someUrl';
                describeUi.describeUi('someName', someUrl, callback);
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                expect(testwindow).toHaveBeenCalled();
                expect(testwindow.mostRecentCall.args[0]).toBe(someUrl);
            });
            it("should inject the calling script into the testwindow", function () {
                var someScriptUrl = 'someScriptUrl';
                globals.jasmineui.currentScriptUrl.andReturn(someScriptUrl);
                var someUrl = 'someUrl';
                describeUi.describeUi('someName', someUrl, callback);
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                var someWindow = {
                    document:{}
                };
                testwindow.mostRecentCall.args[1](someWindow);
                expect(scriptAccessor.writeScriptWithUrl).toHaveBeenCalledWith(someWindow.document, someScriptUrl);
            });
            it("should not add the same script twice", function () {
                var someScriptUrl = 'someScriptUrl';
                globals.jasmineui.currentScriptUrl.andReturn(someScriptUrl);
                var someUrl = 'someUrl';
                describeUi.describeUi('someName', someUrl, callback);
                describeUi.describeUi('someName2', someUrl, callback);
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                testwindow.mostRecentCall.args[1]({});
                expect(scriptAccessor.writeScriptWithUrl.callCount).toBe(1);
            });
        });
        describe('utilityScript', function () {
            it("should add the script from calls to utilityScript", function () {
                var someUtilityScriptUrl = 'someUtilityScriptUrl';
                globals.jasmineui.currentScriptUrl.andReturn(someUtilityScriptUrl);
                describeUi.utilityScript(callback);
                var someScriptUrl = 'someScriptUrl';
                globals.jasmineui.currentScriptUrl.andReturn(someScriptUrl);
                describeUi.describeUi('someName', 'someUrl', callback);
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                testwindow.mostRecentCall.args[1]({});
                expect(scriptAccessor.writeScriptWithUrl.callCount).toBe(2);
                expect(scriptAccessor.writeScriptWithUrl.argsForCall[0][1]).toBe(someUtilityScriptUrl);
                expect(scriptAccessor.writeScriptWithUrl.argsForCall[1][1]).toBe(someScriptUrl);
            });
            it("should not call the callback", function () {
                describeUi.utilityScript(callback);
                expect(callback).not.toHaveBeenCalled();
            });
        });
        describe('beforeLoad', function () {
            it("should call all listeners from beforeLoad in a beforeLoad listener for the new window", function () {
                describeUi.describeUi('someName', 'someUrl', function () {
                    describeUi.beforeLoad(callback);
                });
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                var someWindow = {
                    document:{}
                };
                testwindow.mostRecentCall.args[1](someWindow);
                expect(loadEventSupport.addBeforeLoadListener).toHaveBeenCalled();
                expect(callback).not.toHaveBeenCalled();
                loadEventSupport.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(callback).toHaveBeenCalled();
            });

            it("should separate the beforeLoad listeners for every describeUi call", function () {
                var callback2 = jasmine.createSpy('callback2');
                describeUi.describeUi('someName', 'someUrl', function () {
                    describeUi.beforeLoad(callback);
                });
                jasmineApi.runs.reset();
                describeUi.describeUi('someName2', 'someUrl2', function () {
                    describeUi.beforeLoad(callback2);
                });
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                var someWindow = {
                    document:{}
                };
                testwindow.mostRecentCall.args[1](someWindow);
                loadEventSupport.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(callback).not.toHaveBeenCalled();
                expect(callback2).toHaveBeenCalled();
            });
        });

    });
});