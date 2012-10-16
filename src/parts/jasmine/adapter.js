jasmineui.define('testAdapter', ['jasmine/utils'], function (jasmineUtils) {
    return {
        // client
        listSpecIds:jasmineUtils.listSpecIds,
        initSpecRun:jasmineUtils.initSpecRun,

        // server
        replaceSpecRunner:jasmineUtils.replaceSpecRunner
    };
});


