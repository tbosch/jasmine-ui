jasmineui.require(["factory!client/asyncSensor"], function (asyncSensorFactory) {
    describe("asyncSensor", function () {
        var asyncSensor, globals, logger, instrumentor, config;
        beforeEach(function() {
            globals = {
                addEventListener: jasmine.createSpy('addEventListener'),
                setTimeout: window.setTimeout,
                clearTimeout: window.clearTimeout
            };
            logger = {
                log: jasmine.createSpy('log')
            };
            instrumentor = {
                endCall: jasmine.createSpy('endCall')
            };
            config = {
                asyncSensors: []
            };
            asyncSensor = asyncSensorFactory({
                globals: globals,
                logger: logger,
                instrumentor: instrumentor,
                config: config
            });
            jasmine.Clock.useMock();
        });
        describe('afterAsync', function() {
            it('should call the callback after 50ms if no async work happened', function() {
                var callback = jasmine.createSpy();
                asyncSensor.afterAsync(callback);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(40);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(10);
                expect(callback).toHaveBeenCalled();
            });
            it('should call the callback 50ms after the async sensors return false', function() {
                var callback = jasmine.createSpy();
                var someSensor = "someSensor";
                config.asyncSensors = [someSensor];
                asyncSensor.afterAsync(callback);

                jasmine.Clock.tick(40);
                asyncSensor.updateSensor(someSensor, true);
                var i;
                for (i=0; i<3; i++) {
                    jasmine.Clock.tick(50);
                    expect(callback).not.toHaveBeenCalled();
                }

                asyncSensor.updateSensor(someSensor, false);
                jasmine.Clock.tick(40);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(10);
                expect(callback).toHaveBeenCalled();
            });
            it('should only wait for the sensors in the config', function() {
                var callback = jasmine.createSpy();
                var someSensor = "someSensor";
                config.asyncSensors = [someSensor];
                asyncSensor.afterAsync(callback);
                asyncSensor.updateSensor("someOtherSensor", true);
                jasmine.Clock.tick(50);
                expect(callback).toHaveBeenCalled();
            });
        });

        function findCallArgs(spy, filter) {
            var i;
            for (i=0; i<spy.argsForCall.length; i++) {
                if (filter(spy.argsForCall[i])) {
                    return spy.argsForCall[i];
                }
            }
        }

        function fireEndCall() {
            var i;
            for (i=0; i<instrumentor.endCall.argsForCall.length; i++) {
                instrumentor.endCall.argsForCall[i][0]();
            }
        }

        describe('load sensor', function() {
            it('should wait for the window.onload and the instrumentor.beforeLoad event', function() {
                var loadEventListener = findCallArgs(globals.addEventListener, function(args) {
                    return args[0] === "load";
                });
                config.asyncSensors = ["load"];
                var callback = jasmine.createSpy('callback');
                asyncSensor.afterAsync(callback);
                jasmine.Clock.tick(50);
                expect(callback).not.toHaveBeenCalled();
                fireEndCall();
                jasmine.Clock.tick(50);
                expect(callback).not.toHaveBeenCalled();
                loadEventListener[1]();
                jasmine.Clock.tick(50);
                expect(callback).toHaveBeenCalled();
            });

            it('should wait for the instrumentor.beforeLoad and window.onload event', function() {
                var loadEventListener = findCallArgs(globals.addEventListener, function(args) {
                    return args[0] === "load";
                });
                config.asyncSensors = ["load"];
                var callback = jasmine.createSpy('callback');
                asyncSensor.afterAsync(callback);
                jasmine.Clock.tick(50);
                expect(callback).not.toHaveBeenCalled();
                loadEventListener[1]();
                jasmine.Clock.tick(50);
                expect(callback).not.toHaveBeenCalled();
                fireEndCall();
                jasmine.Clock.tick(60);
                expect(callback).toHaveBeenCalled();
            });
        });

        describe('timeout sensor', function() {
            it('should wait until the timeout is completed', function() {
                var callback = jasmine.createSpy('callback');
                globals.setTimeout(jasmine.createSpy(), 10);
                asyncSensor.afterAsync(callback);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(10);

                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(50);
                expect(callback).toHaveBeenCalled();
            });
            it('should wait until the timeout is canceled', function() {
                var callback = jasmine.createSpy('callback');
                var handle = globals.setTimeout(jasmine.createSpy(), 100);
                asyncSensor.afterAsync(callback);
                globals.clearTimeout(handle);

                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(50);
                expect(callback).toHaveBeenCalled();
            });
        });
    });
});
