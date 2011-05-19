describe("simulate", function() {


    /**
     * Tests the event in an own frame. Needed to check if the jasmine.ui.simulate function
     * also work within frames.
     * @param type
     * @param inputElement
     */
    function testEvent(type, inputElement) {
        var el;
        var received = false;

        loadHtml("/jasmine-ui/test/ui/jasmine-uiSpec.html", function(frame) {
            if (inputElement) {
                frame.$("body").append('<input id="si1" type="text"></input>');
            } else {
                frame.$("body").append('<div id="si1"></div>');
            }
        });
        runs(function() {
            el = testframe().$('#si1')[0];
            if (el.addEventListener) {
                el.addEventListener(type, function() {
                    received = true;
                }, false);
            } else if (el.attachEvent) {
                // IE case
                el.attachEvent('on' + type, function() {
                    received = true;
                });
            }
            jasmine.ui.simulate(el, type);
            expect(received).toEqual(true);
        });
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
    it('should fire change event', function() {
        testEvent('change', true);
    });
    it('should fire blur event', function() {
        testEvent('blur', true);
    });
});
