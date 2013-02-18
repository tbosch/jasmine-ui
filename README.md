# THIS PROJECT HAS BEEN SUPERCEDED BY UITEST.JS

* Github: [https://github.com/tigbro/uitest.js](https://github.com/tigbro/uitest.js)
* Migration-Guide and why: [https://github.com/tigbro/uitest.js/blob/master/docs/jasmineUiMigration.md](https://github.com/tigbro/uitest.js/blob/master/docs/jasmineUiMigration.md).

# !!DO NOT USE ANYMORE!!

Jasmine-Ui
=====================

Description
-------------

Jasmine-UI provides ui tests for jasmine, i.e. written in javascript in jasmine syntax.

If you are interested in more details about ui tests with jasmine, have a look at the german book
[Mobile Web-Apps mit JavaScript](http://www.opitz-consulting.com/go_javascriptbuch).


Features
---------

* It can load a html page and inject tests into that page. By this, the tests run in the same window
  as the page to test and can call any function there or modify any object there.
  This is especially useful if you want to mock some parts of your application (like XHR requests)
  during the test. By this, you don't have trouble with different Object prototypes of different iframes...
  (e.g. for Array or Date...).
  This is the main difference to tools like selenium, ... which test webapps only
  from the outside.
* It has a special ability to wait for the end of asynchronous work. Right now, this is
  XHR, setTimeout, setInterval, page loading, css3 animations and css3 transitions.
  All ui specs will not start until the end of all asynchronous work,
  and waiting will also be applied before all jasmine `runs` statements.
* Supports jasmine specs that span multiple page reloads.
* Special "inplace" mode: This does not create an iframe or popup, but reuses
  the current window. This makes debugging errors very easy, as you only have one browser inspector
  open. Furthermore, the application gets the whole size of the window. By this, layout dependent
  logic can also be tested (e.g. especially useful during mobile development).
* Does not need any additional test server, only a browser to execute the tests
* Supports applications that use requirejs 2.x. Note: Ui-Specs themselves cannot be AMD modules yet.
* Supports: Chrome, Firefox, IE9+, Safari, Mobile Safari, Android Browser.


Usage
----------

1. include jasmine-ui.js as library into your test-code.
2. In the pages that should be tests, include the following line as first line in the header:
   `<script type="text/javascript">eval(sessionStorage.jasmineui);</script>`
2. write asynchronous jasmine tests (using `runs`).
3. For debugging run the tests with the standalone html runner,
   and for continuous integration use the js-test-driver runner.

See `test/ui/baseFunctionalitySpec.js` for an example.

Preconditions:

* The page to be tested must be loaded from the same domain as the test code.

Dependencies:

* jasmine 1.2 (included in the released file)


Sample
------------
- [js-fadein](https://github.com/stefanscheidt/js-fadein): A simple example.
- [Rent Your Legacy Car](https://github.com/mjswa/rylc-html5): A more complex example from the german book [Mobile Web-Apps mit JavaScript](http://www.opitz-consulting.com/go_javascriptbuch).


Build
--------------
Install the dependencies: `npm install`.

Run the tests:

* Run `node server.js` from a command line
* Use the jasmine html runner to run the tests in your browser:
    1. Unit-Tests: http://localhost:9000/test/UnitSpecRunner.html
    2. Ui-Tests: http://localhost:9000/test/UipecRunner.html
* Use `testacular` for continuous integration
    1. `testacular start`
    2. open `http://localhost:9876` with a browser to test in
    3. `testacular run`

Create a new version:

* set the version in the package.json
* execute node build.js

Directory structure
----------------

- compiled: The created versions of jasmine-ui
- src: The main files of jasmine-ui
- test/ui: The ui self tests for jasmine-ui
- test/unit: The unit tests of jasmine-ui


Functions
-----------

#### `jasmineui.loadUi(pageUrl, callback)`
Loads the given page and executes the given callback in it. For all specs contained within the callback
first the page will be loaded and then the spec will be injected into that page and executed there.
This includes all `beforeEach` and `afterEach` callbacks that are defined in this suite or parent suites.

See `test/ui/baseFunctionalitySpec.js` for an example.

#### `jasmineui.beforeLoad(callback)`
Creates a callback that will be executed right before the `DOMContentLoaded` event. By this,
all your application javascript files have been loaded and can be changed, before your application starts.
This is very nice e.g. for mocking backend calls, ...

See `test/ui/beforeLoadSpec.js` for an example.


Detecting and waiting for asynchronous actions
-----------
Jasmine-Ui automatically waits for the end of all asynchronous actions between runs statements.
The calculation is based on so called `sensors`: An asynchronous sensor is a function that returns
true if some asynchronous action is beeing executed.

To add a new custom sensor for async processing:

1. give it a name and put it into the `config.asyncSensors` list
2. update it's state using the `updateSensor` function in the module `asyncSensor`.

E.g.
jasmineui.require(['asyncSensor'], function(asyncSensor) {

    ...
    // async processing started:
    asyncSensor.updateSensor('mySensor', true);

    ...
    // async processing started:
    asyncSensor.updateSensor('mySensor', false);

});


Simulation of Browser-Events
-------

To simulate browser events, there are two ways:

#### Use `jasmineui.simulate(element, type, options)`
This will simulate the real browser event of the given type, fire it on the given element and dispatch it.
The options argument is optional and contains detail-information for the event. See the browser documentation
for this. However, this should not very often be needed as meaningful defaults are provided.

See also the notes from QUnit about this topic:
[http://qunitjs.com/cookbook/#testing_user_actions](http://qunitjs.com/cookbook/#testing_user_actions)

Supported event types:

- Mouse events: mouseup, mousedown, mouseover, mouseout, mousemove, click, dblick
- Keyboard events: keydown, keyup, keypress
- Other events: change, blur, ...

Note that for keyboard events on webkit browsers, this does fire the correct event, but with a wrong keycode
(see https://bugs.webkit.org/show_bug.cgi?id=16735). Note: Chrome works through...

Recommended usage for keyboard events:
Use the simulated events always with keycode 0 (due to the bug above), and fill the needed data before
firing the event.

#### Use `jQuery.trigger`
This does _not_ fire the underlying browser event, but only triggers
event handlers registered by jquery. I.e. this can not be used for
event listeners attached without jquery! Also, this does not do the default navigation of anchor links!



Multiple load specs
------------
Jasmine ui plays nicely with specs that do a reload of the page during their execution: It will save the index
of the last runs statement before the reload and continue at that runs statement after the reload.

Notes:

- all local variables that were set by runs before the reload are lost.
- You can safe data persistently over reloads by assigning values ot `jasmineui.persistent`.
- To prevent code from beeing executed twice, put all
  code in the specs into runs statements.

See `test/ui/multiLoadSpec.js` for an example.


Configuration
------------
Jasmine ui contains some parameters that have default values and which can be set using the global variable `jasmineuiConfig`,
e.g.

    `jasmineuiConfig = { ... }`

This needs to be set _before_ jasmine ui is loaded in the document.

Configuration values:

- `loadMode = ['inplace'|'popup'|'iframe']`: mode to be used for loading the application in `loadUi`.
- `closeTestWindow = boolean`: for `loadMode=iframe|popup` specifies whether the created popup/iframe should be closed after the tests.
- `logEnabled = boolean`: Specifies if extended log output should be created
- `waitsForAsyncTimeout = int`: Specifies the default timeout to be used by the automatic waiting in tests.
- `scripts = Array of {position: ['begin'|'end'], url: 'someUrl']}`: List of urls for utility scripts that should also be injected into the pages.
  This can be the beginning of the html document (`position`=='begin') or the end of the document (`position`=`end`).
- `asyncSensors`: Names of the async sensors to use in automatic waiting for async processing.
- `baseUrl`: Base url for relative urls of pages loaded with `loadUi` and relative urls in `config.scripts`. By default, this is the path
  of the jasmineui script.


Integration with js-test-driver for Continuous Integration
--------------
* Use the `JasmineAdapter.js`. See the usual integration of jasmine and js-test-driver on this.
* Do not include the `jasmine.js` from testacular, as it is already included in jasmine-ui.
* Be sure to not use `inplace` mode (e.g. `popup` mode instead), as js-test-driver does not like applications
  that reload the page.
* configure a js-test-driver proxy that delegates all requests to the webserver that contains
  the pages that should be tests. This is important so that the pages to be tested are
  from the same domain as the test code.

Example jstd configuration:

    server: http://localhost:9876
    load:
    - src/test/webapp/lib/jasmine-ui.js
    - src/test/webapp/lib/JasmineAdapter.js
    - src/test/webapp/lib/jstd-jasmineui-cfg.js
    - src/test/webapp/ui/*.js

    proxy:
    - {matcher: "/<my-app>/*", server: "http://localhost:8080/<myapp>/"}

With the following `jstd-jasmineui-cfg.js`:

    jasmineuiConfig = { loadMode: 'popup' };


Integration with testacular for Continuous Integration
--------------

* Use the `JasmineAdapter.js` of testacular. See the usual integration of jasmine and testacular on this.
* Do not include the `jasmine.js` from testacular, as it is already included in jasmine-ui.
* Be sure to not use `inplace` mode (e.g. `popup` mode instead), as testacular does not like applications
  that reload the page.
* configure a testacular proxy that delegates all requests to the webserver that contains
  the pages that should be tests. This is important so that the pages to be tested are
  from the same domain as the test code.

Example testacular configuration:

    proxies = {'/': 'http://localhost:9000/'};

    files = [
      '/test/lib/jasmineui-testacular.cfg.js',
      '/test/lib/jasmine-ui.js',
      JASMINE_ADAPTER,
      'test/ui/*.js'
    ];

    ...


With the following `jasmineui-testacular.cfg.js`:

    jasmineuiConfig = { loadMode: 'popup' };


