Jasmine-Ui
=====================

Description
-------------

Jasmine-UI provides ui tests for jasmine, i.e. written in javascript in jasmine syntax.

Features:

* It can load a html page and inject tests into that page. By this, the tests run in the same window
  as the page to test and can call any function there or modify any object there.
  This is especially useful if you want to mock some parts of your application (like XHR requests)
  during the test. This is the main difference to tools like selenium, ... which test webapps only
  from the outside.
* It has a special ability to wait for the end of asynchronous work. Right now, this is
  XHR, setTimeout, setInterval, page loading, css3 animations and css3 transitions.
  All ui specs will not start until the end of all asynchronous work,
  and waiting will also be applied before all jasmine `runs` statements.
* Supports jasmine specs that span multiple page reloads.
* If run with the normal jasmine html runner, it does not create an iframe or popup, but reuses
  the current window. This makes debugging errors very easy, as you only have one browser inspector
  open. Furthermore, the application gets the whole size of the window. By this, layout dependent
  logic can also be tested (e.g. especially useful during mobile development).
* If run with js-test-driver, this does use a popup, as js-test-driver does not allow
  a test to change the current page url.
* Supports Firefox, Chrome, Safari and IE9+.
* Does not need any additional test server, only a browser to execute the tests


Usage:

1. include jasmine-ui.js as library into your test-code.
2. In the pages that should be tests, include the following line as first line in the header:
   `<script type="text/javascript">sessionStorage.jasmineui && eval(sessionStorage.jasmineui);</script>`
2. write asynchronous jasmine tests, using the functions below.
3. For debugging run the tests with the standalone html runner,
   and for continous integration use the js-test-driver runner.

Preconditions:

* The page to be tested must be loaded from the same domain as the test code.

Dependencies:

* jasmine (included in the released file)
* js-test-driver Adapter for Jasmine (adapter included in the released file)

Sample
------------
See project [js-fadein](https://github.com/stefanscheidt/js-fadein).

Build
--------------
* run the tests:
    * Run `mvn integration-test` from a command line
    * Use the jasmine html runner:
        1. Go to the project root folder and start a jetty http server using `mvn jetty:run`
        2. Enter `http://localhost:8080/jasmine-ui/test/UnitSpecRunner.html` rep. `http://localhost:8080/jasmine-ui/test/UiSpecRunner.html` in the browser of your choice
* Create a new version:
    * set the version in the pom.xml
    * execute `mvn clean install`. This will create a file in the `compiled` folder and also execute the tests.

Directory structure
----------------

- compiled: The created versions of jasmine-ui
- src: The main files of jasmine-ui
- test/ui: The ui self tests for jasmine-ui
- test/unit: The unit tests of jasmine-ui


Functions
-----------

#### `describeUi(suiteName, pageUrl, callback)`
Creates a jasmine suite for the given page. For all specs contained in this suite
first the page will be loaded and then the spec will be injected into that page and executed there.
This includes all `beforeEach` and `afterEach` callbacks that are defined in this suite or parent suites.

#### `beforeLoad(callback)`
Creates a callback that will be executed right before the `DOMContentLoaded` event. By this,
all your application javascript files have been loaded and can be changed, before your application starts.
This is very nice e.g. for mocking backend calls, ...

To be placed where you would place `beforeEach` in jasmine.

#### `jasmineui.utilityScript(callback)`
This will registers the current javascript file as a utility script needed by the ui tests. I.e.
the script will be loaded into every page that is tests with describeUi.
The callback will only be executed in the page, and not in the jasmine spec runner.

#### `waitsForReload()`
This is needed whenever the test executed a part of the application that does a page reload.
E.g.

    runs(function() {
      window.location.reload();
    };
    waitsForReload();
    runs(function() {
      // Will be called after the reload.
    });


Integration with js-test-driver for Continuous Integration
--------------
* This already includes jasmine and the jasmine adapter for js-test-driver
* configure a js-test-driver proxy that delegates all requests to the webserver that contains
  the pages that should be tests. This is important so that the pages to be tested are
  from the same domain as the test code.

Example configuration:


    server: http://localhost:42442
    load:
    - src/test/webapp/lib/jasmine-ui.js
    - src/test/webapp/ui/*.js

    proxy:
    - {matcher: "/<my-app>/*", server: "http://localhost:8080/<myapp>/"}



Simulation of Browser-Events
-------

To simulate browser events, there are two ways:

#### Use `simulate(element, type, options)`
This will simulate the real browser event of the given type, fire it on the given element and dispatch it.
The options argument is optional and contains detail-information for the event. See the browser documentation
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

