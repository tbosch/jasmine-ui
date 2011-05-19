Jasmine-Ui
=====================

Description
-------------

Jasmine-UI provides ui tests for jasmine. It loads a html page in a frame and instruments it,
so it knows whether there currently is asynchronous work going on.

By this, a test is able to test the ui functionality of a html page.

Usage:

1. include jasmine-ui.js as library into your test-code.
2. In the pages that should be tests, include the following line as first line in the header:
   `<script>parent.instrument && parent.instrument(window);</script>`
2. write asynchronous jasmine tests, using the functions below.
3. For debugging run the tests with the standalone html runner,
   and for continous integration use the js-test-driver runner.

Preconditions:
The page to be tested must be loaded from the same domain as the test code.


Features
----------

* wait until end of asynchronous operations
* works well with single and multi page applications
* bugfixes history handling of some browsers in iframes. So the history object works as expected
* Supports Firefox, Chrome, Safari and IE8 and above.

Functions
-----------

#### loadHtml(<your-html-file>,<instrumentCallback>)
Loads the given html file and waits until it is fully loaded (e.g. it's document is ready).
The second argument is a callback function that will be called right before the document receives it's ready
event, and may be used to mock functions in libraries loaded in the document. The callback gets
the frame as parameter.

To be placed where the run and waits functions can be placed in asynchronous jasmine tests.

#### waitsForAsync()
* Waits until the end of all asynchronous work in the loaded frame:
    * end of all timeouts
    * end of all intervals
    * end of all xhr calls (independent of a framework like jquery, ...)
    * end of all css3 animations
* To be placed where the run and waits functions can be placed in asynchronous jasmine tests.
* Note that this can be extended by custom plugins.

##### testframe()
* Returns the loaded frame
* May be used anywhere after loadHtml was called.

Standalone Jasmine HTML SpecRunner for Test-Debugging
------------
* The File `SpecRunnerStandalone.html` contains the jasmine html runner, including
  all dependencies (css and javascript) in one file, but excluding the jasmine-ui.js library.
* Add your libs (including jasmine-ui.js) and tests to the end of that file and load it in a browser to run the tests.
* This approach is good for debugging your test cases with browser debuggers, as
  you do not have to switch between tools to run and debug the tests.


Integration with js-test-driver for Continuous Integration
--------------
* Be sure to use the jstd-jasmine-async-adapter
* configure a js-test-driver proxy that delegates all requests to the webserver that contains
  the pages that should be tests. This is important so that the pages to be tested are
  from the same domain as the test code.

Example configuration:


    server: http://localhost:42442
    load:
    - src/test/webapp/lib/jasmine.js
    - src/test/webapp/lib/jasmine-ui.js
    - src/test/webapp/lib/jstd-jasmine-async-adapter.js
    - src/test/webapp/ui/*.js

    proxy:
    - {matcher: "/<my-app>/*", server: "http://localhost:8080/<myapp>/"}



Simulation of Browser-Events
-------

To simulate browser events, there are two ways:

#### Use `jasmine.ui.simulate(element, type, options)`
This will simulate the real browser event of the given type, fire it on the given element and dispatch it.
The options argument is optionla and contains detail-information for the event. See the browser documentation
for this. However, this should not very often be needed as meaningful defaults are provided.


Supported event types:

- Mouse events: mouseup, mousedown, mouseover, mouseout, mousemove, click, dblick
- Keyboard events: keydown, keyup, keypress
- Other events: change, blur, ...

Note that for keyboard events on webkit browsers, this does fire the correct event, but with a wrong keycode
(see https://bugs.webkit.org/show_bug.cgi?id=16735).

Recommended usage for keyboard events:
Use the simulated events always with keycode 0 (due to the bug above), and fill the needed data before
firing the event.

#### Use `jQuery.trigger`
This does _not_ fire the underlying browser event, but only triggers
event handlers registered by jquery. I.e. this can not be used for
event listeners attached without jquery! Also, this does not do the default navigation of anchor links!

Running the self-tests for jasmine-ui
--------------
To run the self-tests for the jasmine-ui.js file, there are two possibilities:

- Using maven:
     1. change the property `browser` in the pom.xml to point to a browser of your choice.
      2. Run `mvn integration-test` from a command line

- Using the Jasmine HTML Runner:
      1. Go to the project root folder and start a jetty http server using `mvn jetty:run`
      2. Enter `http://localhost:8080/jasmine-ui/src/SpecRunnerStandalone.html` in the browser of your choice

