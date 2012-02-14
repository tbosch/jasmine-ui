jasmineui.require(['factory!logger'], function (loggerFactory) {
    describe('logger', function () {
        var logger, console;
        beforeEach(function () {
            console = {
                log: jasmine.createSpy('console')
            };
            logger = loggerFactory({
                'globals': {
                    console: console
                }
            });
        });
        it('should log to the console if enabled', function () {
            logger.enabled(true);
            logger.log("hello");
            expect(console.log).toHaveBeenCalledWith("hello");
        });

        it('should not log to the console if disabled', function () {
            logger.enabled(false);
            logger.log("hello");
            expect(console.log).not.toHaveBeenCalled();
        })
    });
});
