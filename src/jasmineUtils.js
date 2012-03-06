jasmineui.define('jasmineUtils', ['jasmineApi'], function (jasmineApi) {
    var jasmine = jasmineApi.jasmine;

    function specPath(spec) {
        var res = suitePath(spec.suite);
        res.push(spec.description);
        return res;
    }

    function suitePath(suite) {
        var res = [];
        while (suite) {
            res.unshift(suite.description);
            suite = suite.parentSuite;
        }
        return res;
    }

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
        return res;
    }


    return {
        specPath:specPath,
        suitePath:suitePath,
        nestedResultsFromJson:nestedResultsFromJson,
        createInfiniteWaitsBlock:createInfiniteWaitsBlock
    }

});