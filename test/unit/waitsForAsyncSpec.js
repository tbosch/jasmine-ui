jasmineui.require(["factory!waitsForAsync"], function (waitsForAsyncFactory) {
    describe("waitsForAsync", function () {
        var waitsForAsync, asyncSensor, jasmineApi, config, logger;
        beforeEach(function () {
            asyncSensor = jasmine.createSpy('asyncSensor');
            jasmineApi = {
                waits:jasmine.createSpy('waits'),
                runs:jasmine.createSpy('runs'),
                waitsFor:jasmine.createSpy('waitsFor')
            };
            config = {
                waitsForAsyncTimeout:100
            };
            logger = {
                log:jasmine.createSpy('log')
            };
            waitsForAsync = waitsForAsyncFactory({
                logger:logger,
                asyncSensor:asyncSensor,
                jasmineApi:jasmineApi,
                config:config
            });
        });

        it("should wait at least 100ms", function () {
            waitsForAsync();
            expect(jasmineApi.waits).toHaveBeenCalledWith(100);
        });

        it("should call waitsFor if asyncSensor is true after the initial wait", function () {
            waitsForAsync();
            asyncSensor.andReturn(true);
            expect(jasmineApi.waitsFor).not.toHaveBeenCalled();
            jasmineApi.runs.argsForCall[1][0]();
            expect(jasmineApi.waitsFor).toHaveBeenCalled();
        });

        it("should wait for the asyncSensor to be false if it was true in the beginning", function () {
            waitsForAsync();
            asyncSensor.andReturn(true);
            jasmineApi.runs.argsForCall[1][0]();
            expect(jasmineApi.waitsFor.mostRecentCall.args[0]()).toBe(false);
            asyncSensor.andReturn(false);
            expect(jasmineApi.waitsFor.mostRecentCall.args[0]()).toBe(true);
        });

        it("should call waits after the end of the first waitsFor", function () {
            waitsForAsync();
            jasmineApi.waits.reset();
            asyncSensor.andReturn(true);
            jasmineApi.runs.argsForCall[1][0]();
            expect(jasmineApi.waits).toHaveBeenCalledWith(100);
        });

        it("should start a second round of waiting if asyncSensor is true again", function () {
            waitsForAsync();
            asyncSensor.andReturn(true);
            jasmineApi.runs.argsForCall[1][0]();
            jasmineApi.waitsFor.reset();
            jasmineApi.runs.mostRecentCall.args[0]();
            expect(jasmineApi.waitsFor).toHaveBeenCalled();
            expect(jasmineApi.waitsFor.mostRecentCall.args[0]()).toBe(false);
            asyncSensor.andReturn(false);
            expect(jasmineApi.waitsFor.mostRecentCall.args[0]()).toBe(true);
        });
    });

});