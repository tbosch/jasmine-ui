jasmineui.define('jasmine/utils', ['jasmine/original', 'globals'], function (jasmineOriginal, globals) {
    var jasmine = jasmineOriginal.jasmine;

    function createInfiniteWaitsBlock(spec) {
        var res = {
            env:spec.env,
            spec:spec,
            execute:function (onComplete) {
                res.onComplete = onComplete;
            }
        };
        spec.addToQueue(res);
        return res;
    }

    var _execute = jasmineOriginal.jasmine.Runner.prototype.execute;

    function replaceSpecRunner(runCallback) {
        jasmineOriginal.jasmine.Runner.prototype.execute = function () {
            var self = this;

            function createSpecs(remoteSpecIds) {
                var i;
                var filteredIds = [];
                for (i = 0; i < remoteSpecIds.length; i++) {
                    var spec = getOrCreateLocalSpec(remoteSpecIds[i]);
                    if (!spec.skipped) {
                        filteredIds.push(remoteSpecIds[i]);
                    }
                }
                _execute.call(self);
                return filteredIds;
            }

            runCallback({
                createSpecs:createSpecs,
                reportSpecResults:reportSpecResults
            });
        };
    }

    function findChildSuite(parent, name) {
        var i, suite;
        for (i = 0; i < parent.suites_.length; i++) {
            suite = parent.suites_[i];
            if (suite.description === name) {
                return suite;
            }
        }
        return null;
    }

    function findSpec(suite, name) {
        var i, spec;
        for (i = 0; i < suite.specs_.length; i++) {
            spec = suite.specs_[i];
            if (spec.description === name) {
                return spec;
            }
        }
        return null;

    }

    function getOrCreateLocalSpec(remoteSpecId) {
        var specPath = splitSpecId(remoteSpecId);
        return getOrCreateSpec(specPath);

        // -------- helper

        function getOrCreateSuite(suitePath) {
            var env = jasmineOriginal.jasmine.getEnv();
            var i, currentSuite, suiteName, childSuite;
            var runner = env.currentRunner();
            currentSuite = runner;
            for (i = 0; i < suitePath.length; i++) {
                suiteName = suitePath[i];
                childSuite = findChildSuite(currentSuite, suiteName);
                if (!childSuite) {
                    childSuite = new jasmineOriginal.jasmine.Suite(env, suiteName, null, currentSuite === runner ? null : currentSuite);
                    currentSuite.add(childSuite);
                }
                currentSuite = childSuite;
            }
            return currentSuite;
        }

        function getOrCreateSpec(specPath) {
            var env = jasmineOriginal.jasmine.getEnv();
            var suite = getOrCreateSuite(specPath.slice(0, specPath.length - 1));
            var specName = specPath[specPath.length - 1];
            var spec = findSpec(suite, specName);
            if (spec) {
                return spec;
            }
            var spec = new jasmineOriginal.jasmine.Spec(env, suite, specName);
            if (!env.specFilter(spec)) {
                spec.skipped = true;
            } else {
                spec.remoteSpecFinished = function () {
                    spec.remoteSpecFinishedCalled = true;
                    if (spec.deferredFinish) {
                        spec.deferredFinish();
                    }
                };

                var _finish = spec.finish;
                spec.finish = function (onComplete) {
                    var self = this;
                    spec.deferredFinish = function () {
                        _finish.call(this, onComplete);
                    };
                    if (spec.remoteSpecFinishedCalled) {
                        spec.deferredFinish();
                    }
                };
            }

            suite.add(spec);
            return spec;
        }
    }


    function reportSpecResults(spec) {
        var specId = spec.id;
        var localSpec = getOrCreateLocalSpec(specId);
        // always report one successful result, as otherwise the spec reporter jasmine-html
        // would display the spec as filtered!
        localSpec.addMatcherResult(new jasmine.ExpectationResult({
            passed:true
        }));
        var i = 0;
        var result;
        for (i = 0; i < spec.results.length; i++) {
            result = spec.results[i];
            localSpec.addMatcherResult(new jasmine.ExpectationResult({
                passed:false,
                message:result.message,
                trace:{stack:result.stack}
            }));
        }

        localSpec.remoteSpecFinished();
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

    function splitSpecId(specId) {
        return specId.split("#");
    }

    return {
        createInfiniteWaitsBlock:createInfiniteWaitsBlock,
        replaceSpecRunner:replaceSpecRunner,
        findRemoteSpecLocally:findRemoteSpecLocally,
        initSpecRun:initSpecRun,
        listSpecIds:listSpecIds,
        specId:specId,
        suiteId:suiteId
    }

});