jasmineui.define('config', ['globals', 'persistentData'], function (globals, persistentData) {
    var pd = persistentData();

    var config = {
        logEnabled:false,
        waitsForAsyncTimeout:5000,
        loadMode:'inplace',
        closeTestWindow:true,
        scripts:[]
    };

    function merge(obj) {
        var prop;
        for (prop in obj) {
            config[prop] = obj[prop];
        }
    }

    if (pd.config) {
        merge(pd.config);
    }
    if (globals.jasmineuiConfig) {
        merge(globals.jasmineuiConfig);
    }
    pd.config = config;

    return config;
});