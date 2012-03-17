jasmineui.require(["factory!utils"], function (utilsFactory) {
    describe("utils", function () {
        var utils;
        beforeEach(function () {
            utils = utilsFactory();
        });
        describe('makeAbsoluteUrl', function () {
            describe('absolute paths', function() {
                it("should not modify urls with hostname and protocol", function () {
                    var someUrl = 'http://asdf';
                    expect(utils.makeAbsoluteUrl('someBaseUrl', someUrl)).toBe(someUrl);
                });
                it("should not modify urls with slash prefix", function () {
                    var someUrl = '/asdf';
                    expect(utils.makeAbsoluteUrl('someBaseUrl', someUrl)).toBe(someUrl);
                });
            });
            describe('relative urls', function() {
                it("should make urls absolute by adding the path of the baseUrl", function () {
                    expect(utils.makeAbsoluteUrl('someBaseUrl/someScript.js', 'someRelativeUrl')).toBe('someBaseUrl/someRelativeUrl');
                });
                it("should make urls absolute by adding the path of the baseUrl", function () {
                    expect(utils.makeAbsoluteUrl('someBaseUrl/someScript.js', 'someRelativeUrl')).toBe('someBaseUrl/someRelativeUrl');
                });
                it("should make urls absolute by adding the path of the baseUrl with baseUrls that contain more than 2 slashes", function () {
                    expect(utils.makeAbsoluteUrl('someBaseUrl/someDir/someScript.js', 'someRelativeUrl')).toBe('someBaseUrl/someDir/someRelativeUrl');
                });
            });
        });

    });

});

