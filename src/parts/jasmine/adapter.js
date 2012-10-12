jasmineui.define('testAdapter', ['jasmine/utils'], function (jasmineUtils) {
    return {
        // client
        listSpecIds:jasmineUtils.listSpecIds,
        executeSpec:jasmineUtils.executeSpec,

        // server
        reportSpecResult:jasmineUtils.reportSpecResult,
        replaceSpecRunner:jasmineUtils.replaceSpecRunner
    };
});


