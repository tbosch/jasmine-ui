Changelog
=====================

1.1.0
-------------
- Separated `describeUi` into `jasmineui.loadUi` and `describe`.
- Removed `jasmineui.inject`. Use the second parameter in `jasmineui.loadUi` instead.
- Added configuration via `jasmineuiConfig` global variable.
- Internal refactoring so that we can easily use QUnit and other testframeworks.

1.0.1
-------------
Updated to jasmine 1.2 and js-test-driver 1.3.4
Now supports applications that are using requirejs 2.x and jQuery holdReady.
Bugfix: specFilter now working.
Bugfix: Sometimes the inplace mode never reached the reporting page again.
Bugfix: asyncWait contained a too little time gap to detect url changes in Chrome.


1.0
-------------
Initial stable release