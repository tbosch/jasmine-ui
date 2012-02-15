jasmineui.require(['factory!server/describeUi'], function (describeUiFactory) {
    describe('server/describeUi', function () {
        var describeUi, jasmineApi, callback, waitsForAsync, testwindow, globals, scriptAccessor, loadEventSupport;
        beforeEach(function () {
            globals = {
                jasmineui:{
                    addScriptUrlTo:jasmine.createSpy('addScriptUrlTo')
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
                afterCurrentScript:jasmine.createSpy('afterCurrentScript')
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
            var someUrl = 'someUrl';
            beforeEach(function () {
                var someUrl = 'someUrl';
                describeUi.describeUi('someName', someUrl, callback);
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
            });
            it("should open a testwindow with the given url", function () {
                jasmineApi.runs.argsForCall[0][0]();
                expect(testwindow).toHaveBeenCalled();
                expect(testwindow.mostRecentCall.args[0]).toBe(someUrl);
            });
            it("should open the testwindow with the jasmine-ui script", function () {
                jasmineApi.runs.argsForCall[0][0]();
                var scriptUrls = testwindow.mostRecentCall.args[1];
                expect(scriptUrls[0]).toBe(globals.jasmineui.scripturl);
            });
            it("should open the testwindow with the jasmine-ui script", function () {
                var jasmineUiScriptUrl = 'jasmineUiScriptUrl';
                globals.jasmineui.addScriptUrlTo.mostRecentCall.args[0].push(jasmineUiScriptUrl);
                jasmineApi.runs.argsForCall[0][0]();
                var scriptUrls = testwindow.mostRecentCall.args[1];
                expect(scriptUrls).toEqual([jasmineUiScriptUrl]);
            });
            it("should add the calling script to the testwindow scripts", function () {
                var jasmineUiScriptUrl = 'jasmineUiScriptUrl';
                globals.jasmineui.addScriptUrlTo.mostRecentCall.args[0].push(jasmineUiScriptUrl);
                var someOtherUrl = 'someOtherUrl';
                expect(scriptAccessor.afterCurrentScript).toHaveBeenCalled();
                scriptAccessor.afterCurrentScript.mostRecentCall.args[1](someOtherUrl);
                jasmineApi.runs.argsForCall[0][0]();
                var scriptUrls = testwindow.mostRecentCall.args[1];
                expect(scriptUrls).toEqual([jasmineUiScriptUrl, someOtherUrl]);
            });
            it("should not add the same script twice", function () {
                var jasmineUiScriptUrl = 'jasmineUiScriptUrl';
                globals.jasmineui.addScriptUrlTo.mostRecentCall.args[0].push(jasmineUiScriptUrl);
                var someOtherUrl = 'someOtherUrl';
                describeUi.describeUi('someName', someUrl, callback);
                expect(scriptAccessor.afterCurrentScript.callCount).toBe(2);
                scriptAccessor.afterCurrentScript.argsForCall[0][1](someOtherUrl);
                scriptAccessor.afterCurrentScript.argsForCall[1][1](someOtherUrl);
                jasmineApi.runs.argsForCall[0][0]();
                var scriptUrls = testwindow.mostRecentCall.args[1];
                expect(scriptUrls).toEqual([jasmineUiScriptUrl, someOtherUrl]);
            });
        });
        describe('utilityScript', function () {
            it("should add the script from calls to utilityScript", function () {
                var jasmineUiScriptUrl = 'jasmineUiScriptUrl';
                globals.jasmineui.addScriptUrlTo.mostRecentCall.args[0].push(jasmineUiScriptUrl);
                var someUtilityScriptUrl = 'someUtilityScriptUrl';
                describeUi.utilityScript(callback);
                expect(scriptAccessor.afterCurrentScript).toHaveBeenCalled();
                scriptAccessor.afterCurrentScript.mostRecentCall.args[1](someUtilityScriptUrl);
                describeUi.describeUi('someName', 'someUrl', callback);
                jasmineApi.describe.mostRecentCall.args[1]();
                jasmineApi.beforeEach.mostRecentCall.args[0]();
                jasmineApi.runs.argsForCall[0][0]();
                var scriptUrls = testwindow.mostRecentCall.args[1];
                expect(scriptUrls).toEqual([jasmineUiScriptUrl, someUtilityScriptUrl]);
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
                testwindow.mostRecentCall.args[2]();
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
                testwindow.mostRecentCall.args[2]();
                loadEventSupport.addBeforeLoadListener.mostRecentCall.args[0]();
                expect(callback).not.toHaveBeenCalled();
                expect(callback2).toHaveBeenCalled();
            });
        });

    });
});