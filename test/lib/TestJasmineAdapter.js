/**
 * @fileoverview Jasmine JsTestDriver Adapter.
 * @author misko@hevery.com (Misko Hevery)
 * @author olmo.maldonado@gmail.com (Olmo Maldonado)
 * @author tobias.bosch@opitz-consulting.com (Tobias Bosch)
 *
 * TODO ddescribe, iit
 * Problem: Dazu muss man wissen, welche specs es insgesamt gibt.
 * Das weiß ich aber nicht, es könnten ja schon welche nicht mehr ausgeführt werden!
 * ==> Problem hat bisheriger Adapter auch!
 */
(function () {


    var Reporter = function () {
        this.reset();
    };
    jasmine.util.inherit(Reporter, jasmine.Reporter);


    Reporter.formatStack = function (stack) {
        var line, lines = (stack || '').split(/\r?\n/), l = lines.length, frames = [];
        for (var i = 0; i < l; i++) {
            line = lines[i];
            if (line.match(/\/jasmine[\.-]/)) continue;
            frames.push(line.replace(/https?:\/\/\w+(:\d+)?\/test\//, '').replace(/^\s*/, '			'));
        }
        return frames.join('\n');
    };


    Reporter.prototype.reset = function () {
        this.specLog = jstestdriver.console.log_ = [];
    };


    Reporter.prototype.log = function (str) {
        this.specLog.push(str);
    };


    Reporter.prototype.reportSpecStarting = function () {
        this.reset();
        this.start = +new Date();
    };


    Reporter.prototype.reportSpecResults = function (spec) {
        var elapsed = +new Date() - this.start, results = spec.results();

        if (results.skipped) return;

        var item, state = 'passed', items = results.getItems(), l = items.length, messages = [];
        for (var i = 0; i < l; i++) {
            item = items[i];
            if (item.passed()) continue;
            state = (item.message.indexOf('AssertionError:') != -1) ? 'error' : 'failed';
            messages.push({
                message:item + '',
                name:item.trace.name,
                stack:Reporter.formatStack(item.trace.stack)
            });
        }

        this.onTestDone(new jstestdriver.TestResult(
            spec.suite.getFullName(),
            spec.description,
            state,
            jstestdriver.angular.toJson(messages),
            this.specLog.join('\n'),
            elapsed
        ));
    };

    function nextTestId() {
        var id = window.jstdJasmineId || 0;
        id++;
        window.jstdJasmineId = id;
        return "jasmine test " + id;
    }

    var JASMINE_TYPE = 'jasmine test case';

    var _it = jasmine.Env.prototype.it;
    jasmine.Env.prototype.it = function (description, func) {
        var spec = _it.apply(this, arguments);
        spec.func = func;
        // Use a 1:1 mapping for TestCase on specs to get the TestCase - file mapping mechanism
        // of js-test-driver.
        var t = new TestCase(nextTestId(), null, JASMINE_TYPE);
        t.spec = spec;
        return spec;
    };

    jasmine.Spec.prototype.reset = function () {
        this.queue = new jasmine.Queue(this.env);
        if (this.func) {
            this.runs(this.func);
        }
        this.results_ = new jasmine.NestedResults();
        this.results_.description = this.description;
    };

    var reporter = new Reporter();
    jasmine.getEnv().reporter = reporter;


    jstestdriver.pluginRegistrar.register({

        name:'jasmine',
        getTestRunsConfigurationFor:function (testCaseInfos, expressions, testRunsConfiguration) {
            // TODO ddescribe, iit implement this here!
            for (var i = 0; i < testCaseInfos.length; i++) {
                if (testCaseInfos[i].getType() == JASMINE_TYPE) {
                    testRunsConfiguration.push(new jstestdriver.TestRunConfiguration(testCaseInfos[i], []));
                }
            }
            return false;
        },
        runTestConfiguration:function (config, onTestDone, onComplete) {
            if (config.getTestCaseInfo().getType() != JASMINE_TYPE) return false;
            reporter.onTestDone = onTestDone;

            var spec = config.getTestCaseInfo().getTemplate().spec;
            spec.reset();
            spec.execute(onComplete);
            return true;
        }
    });

})();