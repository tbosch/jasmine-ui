describe('logger', function () {
    var logger;
    beforeEach(function () {
        logger = require.factory('logger');
        spyOn(console, 'log');
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