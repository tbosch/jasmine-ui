var sampleInjectedCallbackCalled = false;

jasmineui.inject(function() {
    sampleInjectedCallbackCalled = true;
});

jasmineui.inject("sampleInjectedScript.js");