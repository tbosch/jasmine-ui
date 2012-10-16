jasmineui.define('client/testAdapter', ['jasmine/original', 'globals'], function (jasmineOriginal, globals) {
    function initSpecRun(spec) {
        var specId = spec.id;
        var results = spec.results;

        function ignoreDescribesThatDoNotMatchTheSpecId() {
            var currentSuiteId = '';
            globals.describe = function (name) {
                var oldSuiteId = currentSuiteId;
                if (currentSuiteId) {
                    currentSuiteId += '#';
                }
                currentSuiteId += name;
                try {
                    if (specId.indexOf(currentSuiteId) === 0) {
                        return jasmineOriginal.describe.apply(this, arguments);
                    }
                } finally {
                    currentSuiteId = oldSuiteId;
                }
            };
        }

        ignoreDescribesThatDoNotMatchTheSpecId();

        return {
            execute:function (finishedCallback) {
                var spec = findRemoteSpecLocally(specId);
                var specResults = spec.results_;
                var _addResult = specResults.addResult;
                specResults.addResult = function (result) {
                    if (!result.passed()) {
                        results.push({
                            message:result.message,
                            // Convert the contained error to normal serializable objects to preserve
                            // the line number information!
                            stack:result.trace ? result.trace.stack : null
                        });
                    }
                    return _addResult.apply(this, arguments);
                };
                spec.execute(finishedCallback);
            }
        }
    }

    function findRemoteSpecLocally(remoteSpecId) {
        var spec;
        var specs = jasmineOriginal.jasmine.getEnv().currentRunner().specs();
        for (var i = 0; i < specs.length; i++) {
            var currentSpecId = specId(specs[i]);
            if (currentSpecId == remoteSpecId) {
                spec = specs[i];
                break;
            }
        }
        if (!spec) {
            throw new Error("could not find spec with id " + remoteSpecId);
        }
        return spec;
    }

    function listSpecIds() {
        var i;
        var res = [];
        var localSpecs = jasmineOriginal.jasmine.getEnv().currentRunner().specs();
        for (i = 0; i < localSpecs.length; i++) {
            res.push(specId(localSpecs[i]));
        }
        return res;
    }

    function specId(spec) {
        return suiteId(spec.suite) + "#" + spec.description;
    }

    function suiteId(suite) {
        var res = [];
        while (suite) {
            res.unshift(suite.description);
            suite = suite.parentSuite;
        }
        return res.join("#");
    }

    return {
        listSpecIds:listSpecIds,
        initSpecRun:initSpecRun
    };
});


