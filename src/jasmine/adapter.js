jasmineui.define('testAdapter', ['jasmine/utils'], function (jasmineUtils) {
    return {
        listSpecIds:jasmineUtils.listSpecIds,
        executeSpec:jasmineUtils.executeSpec,
        reportSpecResult:jasmineUtils.reportSpecResult,
        replaceSpecRunner:jasmineUtils.replaceSpecRunner
    };
});


