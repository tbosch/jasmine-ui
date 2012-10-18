jasmineui.define('server/loadUi', ['config', 'persistentData', 'scriptAccessor', 'globals', 'server/testAdapter', 'urlLoader', 'urlParser'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader, urlParser) {

    var executionData = {
        firstLoadurl: undefined,
        testScripts: [],
        globalServerErrors: []
    };

    var GLOBAL_ERROR_SPEC_ID = "global#errors";

    var collectExecutionData = true;

    start();

    function start() {
        var pd = persistentData();
        if (config.loadMode === 'inplace') {
            if (pd.specs) {
                if (pd.specIndex === -1) {
                    runInplaceFilterPhase();
                } else {
                    runInplaceResultsPhase();
                }
            } else {
                runInplaceStartPhase();
            }
        } else {
            setPopupMode();
        }
    }

    if (collectExecutionData) {
        globals.addEventListener("error", function (event) {
            executionData.globalServerErrors.push({
                message:event.message
            });
        }, false);
    }

    function loadUi(url) {
        if (!collectExecutionData) {
            return;
        }
        try {
            url = urlLoader.checkAndNormalizeUrl(url);
        } catch (e) {
            executionData.globalServerErrors.push({
                message:e.toString(), stack:e.stack
            });
        }
        executionData.testScripts.push(scriptAccessor.currentScriptUrl());
        if (!executionData.firstLoadUiUrl) {
            executionData.firstLoadUiUrl = url;
        }
    }

    function runInplaceStartPhase() {
        testAdapter.interceptSpecRunner(function (runner) {
            var firstUrl = prepareExecution(runner);
            if (!firstUrl) {
                return;
            }
            persistentData().reporterUrl = globals.location.href;
            urlLoader.navigateWithReloadTo(globals, firstUrl);
        });
    }

    function runInplaceFilterPhase() {
        collectExecutionData = false;
        var pd = persistentData();
        testAdapter.interceptSpecRunner(function (runner) {
            createAndFilterSpecs(runner);
            if (pd.specs.length) {
                // start the execution
                pd.specIndex = 0;
                urlLoader.navigateWithReloadTo(globals, pd.specs[0].url);
            }
        });
    }

    function runInplaceResultsPhase() {
        collectExecutionData = false;
        var pd = persistentData();
        testAdapter.interceptSpecRunner(function (runner) {
            createAndFilterSpecs(runner);
            var i, spec;
            for (i = 0; i < pd.specs.length; i++) {
                spec = pd.specs[i];
                testAdapter.reportSpecResults(spec);
            }
        });
    }

    function createAndFilterSpecs(runner) {
        var pd = persistentData();
        // if we have errors during analyze phase, create the global error spec for reporting it.
        if (pd.globalErrors.length) {
            var errorSpec = {
                id: GLOBAL_ERROR_SPEC_ID,
                results: pd.globalErrors
            };
            testAdapter.createSpecs([errorSpec]);
            testAdapter.reportSpecResults(errorSpec);
            pd.specs = [];
        } else {
            pd.specs = testAdapter.createSpecs(pd.specs);
        }
        return pd.specs;
    }

    function setPopupMode() {
        testAdapter.interceptSpecRunner(function (runner) {
            // Now execute the ui specs
            var firstUrl = prepareExecution(runner);
            if (!firstUrl) {
                return;
            }
            urlLoader.openTestWindow(firstUrl);
            globals.jasmineui.loadUiServer = {
                createAndFilterSpecs:function () {
                    createAndFilterSpecs(runner);
                },
                specFinished:function (spec) {
                    testAdapter.reportSpecResults(spec);
                },
                runFinished:function () {
                    urlLoader.closeTestWindow();
                }
            };
        });
    }

    function prepareExecution(runner) {
        var pd = persistentData();

        pd.analyzeScripts = executionData.testScripts;
        pd.specs = [];
        pd.specIndex = -1;
        pd.globalErrors = executionData.globalServerErrors;
        if (!executionData.firstLoadUiUrl) {
            createAndFilterSpecs(runner);
            return null;
        }
        if (executionData.globalServerErrors.length > 0) {
            // abort the test execution!
            createAndFilterSpecs(runner);
            return null;
        }
        return executionData.firstLoadUiUrl;
    }

    return {
        globals:{
            jasmineui:{
                loadUi:loadUi
            }
        }
    }
});