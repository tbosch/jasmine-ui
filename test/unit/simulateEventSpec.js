describe("simulate", function () {
    var simulate, addEventListener, el;
    beforeEach(function () {
        simulate = require.factory('simulateEvent');
        addEventListener = require.factory('eventListener').addEventListener;
    });
    afterEach(function() {
        el.remove();
    });

    /**
     * Tests the event.
     * @param type
     * @param inputElement
     */
    function testEvent(type, inputElement) {
        var received = false;
        if (inputElement) {
            $("body").append('<input id="si1" type="text"></input>');
        } else {
            $("body").append('<div id="si1"></div>');
        }

        el = $('#si1');
        addEventListener(el[0], type, function () {
            received = true;
        });
        simulate(el[0], type);
        expect(received).toEqual(true);
    }

    it('should fire mouseup event', function () {
        testEvent('mouseup');
    });
    it('should fire mousedown event', function () {
        testEvent('mousedown');
    });
    it('should fire click event', function () {
        testEvent('click');
    });
    it('should fire dblclick event', function () {
        testEvent('dblclick');
    });
    it('should fire mouseover event', function () {
        testEvent('mouseover');
    });
    it('should fire mouseout event', function () {
        testEvent('mouseout');
    });
    it('should fire mousemove event', function () {
        testEvent('mousemove');
    });
    it('should fire keydown event', function () {
        testEvent('keydown');
    });
    it('should fire keyup event', function () {
        testEvent('keyup');
    });
    it('should fire keypress event', function () {
        testEvent('keypress');
    });
    it('should fire change event', function () {
        testEvent('change', true);
    });
    it('should fire blur event', function () {
        testEvent('blur', true);
    });
});
