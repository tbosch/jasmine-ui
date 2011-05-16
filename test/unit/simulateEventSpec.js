describe("simulate", function() {
    function testEvent(type) {
        var div = $('<div id="d1"></div>')[0];
        var received = false;
        if (div.addEventListener) {
            div.addEventListener(type, function() {
                received = true;
            },false);
        } else if (div.attachEvent) {
            // IE case
            div.attachEvent('on'+type, function() {
                received = true;
            });
        }
        jasmine.ui.simulate(div, type);
        expect(received).toEqual(true);
    }

    it('should fire mouseup event', function() {
        testEvent('mouseup');
    });
    it('should fire mousedown event', function() {
        testEvent('mousedown');
    });
    it('should fire click event', function() {
        testEvent('click');
    });
    it('should fire dblclick event', function() {
        testEvent('dblclick');
    });
    it('should fire mouseover event', function() {
        testEvent('mouseover');
    });
    it('should fire mouseout event', function() {
        testEvent('mouseout');
    });
    it('should fire mousemove event', function() {
        testEvent('mousemove');
    });
    it('should fire keydown event', function() {
        testEvent('keydown');
    });
    it('should fire keyup event', function() {
        testEvent('keyup');
    });
    it('should fire keypress event', function() {
        testEvent('keypress');
    });
});
