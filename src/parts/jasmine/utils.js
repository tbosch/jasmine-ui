jasmineui.define('jasmine/utils', ['jasmine/original', 'globals'], function (jasmineOriginal, globals) {
    var jasmine = jasmineOriginal.jasmine;

    var ClonedNestedResults = function (data) {
        for (var x in data) {
            this[x] = data[x];
        }
        for (var i = 0; i < this.items_.length; i++) {
            this.items_[i] = new ClonedExpectationResult(this.items_[i]);
        }
    };
    ClonedNestedResults.prototype = jasmine.NestedResults.prototype;

    var ClonedExpectationResult = function (data) {
        for (var x in data) {
            this[x] = data[x];
        }
    };
    ClonedExpectationResult.prototype = jasmine.ExpectationResult.prototype;

    function nestedResultsFromJson(data) {
        return new ClonedNestedResults(data);
    }

    function makeExpectationResultSerializable() {
        function copyPrimitive(obj) {
            if (typeof obj === 'object') {
                return obj.toString();
            }
            return obj;
        }

        function shallowCopyWithArray(obj) {
            if (typeof obj === 'object') {
                if (obj.slice) {
                    // Array
                    var res = [];
                    for (var i = 0; i < obj.length; i++) {
                        res.push(copyPrimitive(obj[i]));
                    }
                    obj = res;
                }
            }
            return copyPrimitive(obj);
        }

        var _ExpectationResult = jasmine.ExpectationResult;
        jasmine.ExpectationResult = function (data) {
            _ExpectationResult.call(this, data);
            // Convert the contained error to normal serializable objects to preserve
            // the line number information!
            if (this.trace) {
                this.trace = { stack:this.trace.stack};
            }
            // The actual and expected value is only needed for displaying errors.
            // So we just do a copy of the first object level. By this, the object
            // stays serializable.
            this.actual = shallowCopyWithArray(this.actual);
            this.expected = shallowCopyWithArray(this.expected);
            return this;
        };
        jasmine.ExpectationResult.prototype = _ExpectationResult.prototype;
    }

    makeExpectationResultSerializable();

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
                createSpecs: createSpecs,
                reportSpecResult: reportSpecResult
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
                spec.remoteSpecFinished = function (results) {
                    spec.remoteSpecResults = results;
                    spec.results_ = nestedResultsFromJson(results);
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
                    if (spec.remoteSpecResults) {
                        spec.deferredFinish();
                    }
                };
            }

            suite.add(spec);
            return spec;
        }
    }


    function reportSpecResult(specId, results) {
        var spec = getOrCreateLocalSpec(specId);
        spec.remoteSpecFinished(results);
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

    function initSpecRun(specId) {
        // ignore describes that do not match to the given specId
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
        return {
            execute:function (resultCallback) {
                var spec = findRemoteSpecLocally(specId);
                spec.execute(function () {
                    resultCallback(spec.results_);
                });
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

    function filterSpec(specId) {
        var spec = findRemoteSpecLocally(specId);
        var env = jasmineOriginal.jasmine.getEnv();
        return env.specFilter(spec);
    }

    return {
        nestedResultsFromJson:nestedResultsFromJson,
        createInfiniteWaitsBlock:createInfiniteWaitsBlock,
        replaceSpecRunner:replaceSpecRunner,
        findRemoteSpecLocally:findRemoteSpecLocally,
        initSpecRun:initSpecRun,
        listSpecIds:listSpecIds,
        specId:specId,
        suiteId:suiteId
    }

});