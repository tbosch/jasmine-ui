Jasmine-Ui
=====================

Description
-------------

Jasmine-UI provides ui tests for jasmine. It loads a html page in a frame and instruments it,
so it knows whether there currently is asynchronous work going on.

By this, a test is able to test the ui functionality of a html page.

Usage:

1. include jasmine-ui.js as library into your test-code.
2. write asynchronous jasmine tests, using the functions below.

Preconditions:
The page to be tested must be loaded from the same domain as the test code.

Restrictions:
This framework can only test one html page in one test. If the html page is changed,
the test needs to end. This is due to the fact that the instrumentation of html pages
is done on the client, and html does not allow to change the location during the unload
of pages.

Functions
-----------

#### loadHtml(<your-html-file>)
Loads the given html file and waits until it is fully loaded (e.g. it's document is ready).
To be placed where the run and waits functions can be placed in asynchronous jasmine tests.

#### instrumentHtml
`instrumentHtml(function(frameWindow) {...});`

* Is called when the document in loadHtml was fully loaded in a frame
* Can be used to instrument the loaded document e.g. with proxies for the XHR, ...
* To be placed where the run and waits functions can be placed in asynchronous jasmine tests.

#### waitsForAsync()
* Waits until the end of all asynchronous work in the loaded frame:
    * end of all timeouts
    * end of all intervals
    * end of all jquery ajax calls
    * end of all css3 animations
* To be placed where the run and waits functions can be placed in asynchronous jasmine tests.
* Note that this can be extended by custom plugins.

##### frame()
* Returns the loaded frame
* May be used anywhere after loadHtml was called.

Usage from Jasmine HTML SpecRunner
------------
* Include jasmine-ui.js in the SpecRunner.html, after jasmine.js
* Everything should work as expected

Usage from js-test-driver
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

To simulate browser events, there are several ways:

#### Use `jQuery.trigger`
This does _not_ fire the underlying browser event, but only triggers
event handlers registered by jquery. I.e. this can not be used to click on links, ... if the
native navigation of the browser should be used.

#### Simulate events using document.createEvent
This is more promising, and works well for mouse events, see here:
https://github.com/jquery/jquery-ui/blob/master/tests/jquery.simulate.js
However, this does not work well for keyboard events (Firefox works well, Safari and Chrome not,
see this bug: https://bugs.webkit.org/show_bug.cgi?id=16735; however, for Safari we could use a TextEvent...).


Implementation Details
-----------
For the wait to work correctly, this loads the page to be tests via ajax,
instruments it and creates a dynamic iframe with the page content:

- Adds extra javascript code at the beginning of the page to
  get all calls to window.setTimout, window.XMLHttpRequest, ...
- Assigns a base tag so all relative links will still work. Note that this
  leads to the problem, that links that only contain hashes trigger a complete
  page reload. However, this is prevented by special onclick handlers.