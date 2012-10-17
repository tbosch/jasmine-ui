/**
* Jasmine-Ui v1.1.0-SNAPSHOT
* http://github.com/tigbro/jasmine-ui
*
* Copyright 2011, Tobias Bosch (OPITZ CONSULTING GmbH)
* Licensed under the MIT license.
*
* Includes jasmine BDD (https://github.com/pivotal/jasmine).
* Copyright Pivotal Labs
*
*/
if (!window.jasmine) {
var isCommonJS = typeof window == "undefined";

/**
 * Top level namespace for Jasmine, a lightweight JavaScript BDD/spec/testing framework.
 *
 * @namespace
 */
var jasmine = {};
if (isCommonJS) exports.jasmine = jasmine;
/**
 * @private
 */
jasmine.unimplementedMethod_ = function() {
  throw new Error("unimplemented method");
};

/**
 * Use <code>jasmine.undefined</code> instead of <code>undefined</code>, since <code>undefined</code> is just
 * a plain old variable and may be redefined by somebody else.
 *
 * @private
 */
jasmine.undefined = jasmine.___undefined___;

/**
 * Show diagnostic messages in the console if set to true
 *
 */
jasmine.VERBOSE = false;

/**
 * Default interval in milliseconds for event loop yields (e.g. to allow network activity or to refresh the screen with the HTML-based runner). Small values here may result in slow test running. Zero means no updates until all tests have completed.
 *
 */
jasmine.DEFAULT_UPDATE_INTERVAL = 250;

/**
 * Default timeout interval in milliseconds for waitsFor() blocks.
 */
jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;

jasmine.getGlobal = function() {
  function getGlobal() {
    return this;
  }

  return getGlobal();
};

/**
 * Allows for bound functions to be compared.  Internal use only.
 *
 * @ignore
 * @private
 * @param base {Object} bound 'this' for the function
 * @param name {Function} function to find
 */
jasmine.bindOriginal_ = function(base, name) {
  var original = base[name];
  if (original.apply) {
    return function() {
      return original.apply(base, arguments);
    };
  } else {
    // IE support
    return jasmine.getGlobal()[name];
  }
};

jasmine.setTimeout = jasmine.bindOriginal_(jasmine.getGlobal(), 'setTimeout');
jasmine.clearTimeout = jasmine.bindOriginal_(jasmine.getGlobal(), 'clearTimeout');
jasmine.setInterval = jasmine.bindOriginal_(jasmine.getGlobal(), 'setInterval');
jasmine.clearInterval = jasmine.bindOriginal_(jasmine.getGlobal(), 'clearInterval');

jasmine.MessageResult = function(values) {
  this.type = 'log';
  this.values = values;
  this.trace = new Error(); // todo: test better
};

jasmine.MessageResult.prototype.toString = function() {
  var text = "";
  for (var i = 0; i < this.values.length; i++) {
    if (i > 0) text += " ";
    if (jasmine.isString_(this.values[i])) {
      text += this.values[i];
    } else {
      text += jasmine.pp(this.values[i]);
    }
  }
  return text;
};

jasmine.ExpectationResult = function(params) {
  this.type = 'expect';
  this.matcherName = params.matcherName;
  this.passed_ = params.passed;
  this.expected = params.expected;
  this.actual = params.actual;
  this.message = this.passed_ ? 'Passed.' : params.message;

  var trace = (params.trace || new Error(this.message));
  this.trace = this.passed_ ? '' : trace;
};

jasmine.ExpectationResult.prototype.toString = function () {
  return this.message;
};

jasmine.ExpectationResult.prototype.passed = function () {
  return this.passed_;
};

/**
 * Getter for the Jasmine environment. Ensures one gets created
 */
jasmine.getEnv = function() {
  var env = jasmine.currentEnv_ = jasmine.currentEnv_ || new jasmine.Env();
  return env;
};

/**
 * @ignore
 * @private
 * @param value
 * @returns {Boolean}
 */
jasmine.isArray_ = function(value) {
  return jasmine.isA_("Array", value);
};

/**
 * @ignore
 * @private
 * @param value
 * @returns {Boolean}
 */
jasmine.isString_ = function(value) {
  return jasmine.isA_("String", value);
};

/**
 * @ignore
 * @private
 * @param value
 * @returns {Boolean}
 */
jasmine.isNumber_ = function(value) {
  return jasmine.isA_("Number", value);
};

/**
 * @ignore
 * @private
 * @param {String} typeName
 * @param value
 * @returns {Boolean}
 */
jasmine.isA_ = function(typeName, value) {
  return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
};

/**
 * Pretty printer for expecations.  Takes any object and turns it into a human-readable string.
 *
 * @param value {Object} an object to be outputted
 * @returns {String}
 */
jasmine.pp = function(value) {
  var stringPrettyPrinter = new jasmine.StringPrettyPrinter();
  stringPrettyPrinter.format(value);
  return stringPrettyPrinter.string;
};

/**
 * Returns true if the object is a DOM Node.
 *
 * @param {Object} obj object to check
 * @returns {Boolean}
 */
jasmine.isDomNode = function(obj) {
  return obj.nodeType > 0;
};

/**
 * Returns a matchable 'generic' object of the class type.  For use in expecations of type when values don't matter.
 *
 * @example
 * // don't care about which function is passed in, as long as it's a function
 * expect(mySpy).toHaveBeenCalledWith(jasmine.any(Function));
 *
 * @param {Class} clazz
 * @returns matchable object of the type clazz
 */
jasmine.any = function(clazz) {
  return new jasmine.Matchers.Any(clazz);
};

/**
 * Returns a matchable subset of a JSON object. For use in expectations when you don't care about all of the
 * attributes on the object.
 *
 * @example
 * // don't care about any other attributes than foo.
 * expect(mySpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: "bar"});
 *
 * @param sample {Object} sample
 * @returns matchable object for the sample
 */
jasmine.objectContaining = function (sample) {
    return new jasmine.Matchers.ObjectContaining(sample);
};

/**
 * Jasmine Spies are test doubles that can act as stubs, spies, fakes or when used in an expecation, mocks.
 *
 * Spies should be created in test setup, before expectations.  They can then be checked, using the standard Jasmine
 * expectation syntax. Spies can be checked if they were called or not and what the calling params were.
 *
 * A Spy has the following fields: wasCalled, callCount, mostRecentCall, and argsForCall (see docs).
 *
 * Spies are torn down at the end of every spec.
 *
 * Note: Do <b>not</b> call new jasmine.Spy() directly - a spy must be created using spyOn, jasmine.createSpy or jasmine.createSpyObj.
 *
 * @example
 * // a stub
 * var myStub = jasmine.createSpy('myStub');  // can be used anywhere
 *
 * // spy example
 * var foo = {
 *   not: function(bool) { return !bool; }
 * }
 *
 * // actual foo.not will not be called, execution stops
 * spyOn(foo, 'not');

 // foo.not spied upon, execution will continue to implementation
 * spyOn(foo, 'not').andCallThrough();
 *
 * // fake example
 * var foo = {
 *   not: function(bool) { return !bool; }
 * }
 *
 * // foo.not(val) will return val
 * spyOn(foo, 'not').andCallFake(function(value) {return value;});
 *
 * // mock example
 * foo.not(7 == 7);
 * expect(foo.not).toHaveBeenCalled();
 * expect(foo.not).toHaveBeenCalledWith(true);
 *
 * @constructor
 * @see spyOn, jasmine.createSpy, jasmine.createSpyObj
 * @param {String} name
 */
jasmine.Spy = function(name) {
  /**
   * The name of the spy, if provided.
   */
  this.identity = name || 'unknown';
  /**
   *  Is this Object a spy?
   */
  this.isSpy = true;
  /**
   * The actual function this spy stubs.
   */
  this.plan = function() {
  };
  /**
   * Tracking of the most recent call to the spy.
   * @example
   * var mySpy = jasmine.createSpy('foo');
   * mySpy(1, 2);
   * mySpy.mostRecentCall.args = [1, 2];
   */
  this.mostRecentCall = {};

  /**
   * Holds arguments for each call to the spy, indexed by call count
   * @example
   * var mySpy = jasmine.createSpy('foo');
   * mySpy(1, 2);
   * mySpy(7, 8);
   * mySpy.mostRecentCall.args = [7, 8];
   * mySpy.argsForCall[0] = [1, 2];
   * mySpy.argsForCall[1] = [7, 8];
   */
  this.argsForCall = [];
  this.calls = [];
};

/**
 * Tells a spy to call through to the actual implemenatation.
 *
 * @example
 * var foo = {
 *   bar: function() { // do some stuff }
 * }
 *
 * // defining a spy on an existing property: foo.bar
 * spyOn(foo, 'bar').andCallThrough();
 */
jasmine.Spy.prototype.andCallThrough = function() {
  this.plan = this.originalValue;
  return this;
};

/**
 * For setting the return value of a spy.
 *
 * @example
 * // defining a spy from scratch: foo() returns 'baz'
 * var foo = jasmine.createSpy('spy on foo').andReturn('baz');
 *
 * // defining a spy on an existing property: foo.bar() returns 'baz'
 * spyOn(foo, 'bar').andReturn('baz');
 *
 * @param {Object} value
 */
jasmine.Spy.prototype.andReturn = function(value) {
  this.plan = function() {
    return value;
  };
  return this;
};

/**
 * For throwing an exception when a spy is called.
 *
 * @example
 * // defining a spy from scratch: foo() throws an exception w/ message 'ouch'
 * var foo = jasmine.createSpy('spy on foo').andThrow('baz');
 *
 * // defining a spy on an existing property: foo.bar() throws an exception w/ message 'ouch'
 * spyOn(foo, 'bar').andThrow('baz');
 *
 * @param {String} exceptionMsg
 */
jasmine.Spy.prototype.andThrow = function(exceptionMsg) {
  this.plan = function() {
    throw exceptionMsg;
  };
  return this;
};

/**
 * Calls an alternate implementation when a spy is called.
 *
 * @example
 * var baz = function() {
 *   // do some stuff, return something
 * }
 * // defining a spy from scratch: foo() calls the function baz
 * var foo = jasmine.createSpy('spy on foo').andCall(baz);
 *
 * // defining a spy on an existing property: foo.bar() calls an anonymnous function
 * spyOn(foo, 'bar').andCall(function() { return 'baz';} );
 *
 * @param {Function} fakeFunc
 */
jasmine.Spy.prototype.andCallFake = function(fakeFunc) {
  this.plan = fakeFunc;
  return this;
};

/**
 * Resets all of a spy's the tracking variables so that it can be used again.
 *
 * @example
 * spyOn(foo, 'bar');
 *
 * foo.bar();
 *
 * expect(foo.bar.callCount).toEqual(1);
 *
 * foo.bar.reset();
 *
 * expect(foo.bar.callCount).toEqual(0);
 */
jasmine.Spy.prototype.reset = function() {
  this.wasCalled = false;
  this.callCount = 0;
  this.argsForCall = [];
  this.calls = [];
  this.mostRecentCall = {};
};

jasmine.createSpy = function(name) {

  var spyObj = function() {
    spyObj.wasCalled = true;
    spyObj.callCount++;
    var args = jasmine.util.argsToArray(arguments);
    spyObj.mostRecentCall.object = this;
    spyObj.mostRecentCall.args = args;
    spyObj.argsForCall.push(args);
    spyObj.calls.push({object: this, args: args});
    return spyObj.plan.apply(this, arguments);
  };

  var spy = new jasmine.Spy(name);

  for (var prop in spy) {
    spyObj[prop] = spy[prop];
  }

  spyObj.reset();

  return spyObj;
};

/**
 * Determines whether an object is a spy.
 *
 * @param {jasmine.Spy|Object} putativeSpy
 * @returns {Boolean}
 */
jasmine.isSpy = function(putativeSpy) {
  return putativeSpy && putativeSpy.isSpy;
};

/**
 * Creates a more complicated spy: an Object that has every property a function that is a spy.  Used for stubbing something
 * large in one call.
 *
 * @param {String} baseName name of spy class
 * @param {Array} methodNames array of names of methods to make spies
 */
jasmine.createSpyObj = function(baseName, methodNames) {
  if (!jasmine.isArray_(methodNames) || methodNames.length === 0) {
    throw new Error('createSpyObj requires a non-empty array of method names to create spies for');
  }
  var obj = {};
  for (var i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jasmine.createSpy(baseName + '.' + methodNames[i]);
  }
  return obj;
};

/**
 * All parameters are pretty-printed and concatenated together, then written to the current spec's output.
 *
 * Be careful not to leave calls to <code>jasmine.log</code> in production code.
 */
jasmine.log = function() {
  var spec = jasmine.getEnv().currentSpec;
  spec.log.apply(spec, arguments);
};

/**
 * Function that installs a spy on an existing object's method name.  Used within a Spec to create a spy.
 *
 * @example
 * // spy example
 * var foo = {
 *   not: function(bool) { return !bool; }
 * }
 * spyOn(foo, 'not'); // actual foo.not will not be called, execution stops
 *
 * @see jasmine.createSpy
 * @param obj
 * @param methodName
 * @returns a Jasmine spy that can be chained with all spy methods
 */
var spyOn = function(obj, methodName) {
  return jasmine.getEnv().currentSpec.spyOn(obj, methodName);
};
if (isCommonJS) exports.spyOn = spyOn;

/**
 * Creates a Jasmine spec that will be added to the current suite.
 *
 * // TODO: pending tests
 *
 * @example
 * it('should be true', function() {
 *   expect(true).toEqual(true);
 * });
 *
 * @param {String} desc description of this specification
 * @param {Function} func defines the preconditions and expectations of the spec
 */
var it = function(desc, func) {
  return jasmine.getEnv().it(desc, func);
};
if (isCommonJS) exports.it = it;

/**
 * Creates a <em>disabled</em> Jasmine spec.
 *
 * A convenience method that allows existing specs to be disabled temporarily during development.
 *
 * @param {String} desc description of this specification
 * @param {Function} func defines the preconditions and expectations of the spec
 */
var xit = function(desc, func) {
  return jasmine.getEnv().xit(desc, func);
};
if (isCommonJS) exports.xit = xit;

/**
 * Starts a chain for a Jasmine expectation.
 *
 * It is passed an Object that is the actual value and should chain to one of the many
 * jasmine.Matchers functions.
 *
 * @param {Object} actual Actual value to test against and expected value
 */
var expect = function(actual) {
  return jasmine.getEnv().currentSpec.expect(actual);
};
if (isCommonJS) exports.expect = expect;

/**
 * Defines part of a jasmine spec.  Used in cominbination with waits or waitsFor in asynchrnous specs.
 *
 * @param {Function} func Function that defines part of a jasmine spec.
 */
var runs = function(func) {
  jasmine.getEnv().currentSpec.runs(func);
};
if (isCommonJS) exports.runs = runs;

/**
 * Waits a fixed time period before moving to the next block.
 *
 * @deprecated Use waitsFor() instead
 * @param {Number} timeout milliseconds to wait
 */
var waits = function(timeout) {
  jasmine.getEnv().currentSpec.waits(timeout);
};
if (isCommonJS) exports.waits = waits;

/**
 * Waits for the latchFunction to return true before proceeding to the next block.
 *
 * @param {Function} latchFunction
 * @param {String} optional_timeoutMessage
 * @param {Number} optional_timeout
 */
var waitsFor = function(latchFunction, optional_timeoutMessage, optional_timeout) {
  jasmine.getEnv().currentSpec.waitsFor.apply(jasmine.getEnv().currentSpec, arguments);
};
if (isCommonJS) exports.waitsFor = waitsFor;

/**
 * A function that is called before each spec in a suite.
 *
 * Used for spec setup, including validating assumptions.
 *
 * @param {Function} beforeEachFunction
 */
var beforeEach = function(beforeEachFunction) {
  jasmine.getEnv().beforeEach(beforeEachFunction);
};
if (isCommonJS) exports.beforeEach = beforeEach;

/**
 * A function that is called after each spec in a suite.
 *
 * Used for restoring any state that is hijacked during spec execution.
 *
 * @param {Function} afterEachFunction
 */
var afterEach = function(afterEachFunction) {
  jasmine.getEnv().afterEach(afterEachFunction);
};
if (isCommonJS) exports.afterEach = afterEach;

/**
 * Defines a suite of specifications.
 *
 * Stores the description and all defined specs in the Jasmine environment as one suite of specs. Variables declared
 * are accessible by calls to beforeEach, it, and afterEach. Describe blocks can be nested, allowing for specialization
 * of setup in some tests.
 *
 * @example
 * // TODO: a simple suite
 *
 * // TODO: a simple suite with a nested describe block
 *
 * @param {String} description A string, usually the class under test.
 * @param {Function} specDefinitions function that defines several specs.
 */
var describe = function(description, specDefinitions) {
  return jasmine.getEnv().describe(description, specDefinitions);
};
if (isCommonJS) exports.describe = describe;

/**
 * Disables a suite of specifications.  Used to disable some suites in a file, or files, temporarily during development.
 *
 * @param {String} description A string, usually the class under test.
 * @param {Function} specDefinitions function that defines several specs.
 */
var xdescribe = function(description, specDefinitions) {
  return jasmine.getEnv().xdescribe(description, specDefinitions);
};
if (isCommonJS) exports.xdescribe = xdescribe;


// Provide the XMLHttpRequest class for IE 5.x-6.x:
jasmine.XmlHttpRequest = (typeof XMLHttpRequest == "undefined") ? function() {
  function tryIt(f) {
    try {
      return f();
    } catch(e) {
    }
    return null;
  }

  var xhr = tryIt(function() {
    return new ActiveXObject("Msxml2.XMLHTTP.6.0");
  }) ||
    tryIt(function() {
      return new ActiveXObject("Msxml2.XMLHTTP.3.0");
    }) ||
    tryIt(function() {
      return new ActiveXObject("Msxml2.XMLHTTP");
    }) ||
    tryIt(function() {
      return new ActiveXObject("Microsoft.XMLHTTP");
    });

  if (!xhr) throw new Error("This browser does not support XMLHttpRequest.");

  return xhr;
} : XMLHttpRequest;
/**
 * @namespace
 */
jasmine.util = {};

/**
 * Declare that a child class inherit it's prototype from the parent class.
 *
 * @private
 * @param {Function} childClass
 * @param {Function} parentClass
 */
jasmine.util.inherit = function(childClass, parentClass) {
  /**
   * @private
   */
  var subclass = function() {
  };
  subclass.prototype = parentClass.prototype;
  childClass.prototype = new subclass();
};

jasmine.util.formatException = function(e) {
  var lineNumber;
  if (e.line) {
    lineNumber = e.line;
  }
  else if (e.lineNumber) {
    lineNumber = e.lineNumber;
  }

  var file;

  if (e.sourceURL) {
    file = e.sourceURL;
  }
  else if (e.fileName) {
    file = e.fileName;
  }

  var message = (e.name && e.message) ? (e.name + ': ' + e.message) : e.toString();

  if (file && lineNumber) {
    message += ' in ' + file + ' (line ' + lineNumber + ')';
  }

  return message;
};

jasmine.util.htmlEscape = function(str) {
  if (!str) return str;
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

jasmine.util.argsToArray = function(args) {
  var arrayOfArgs = [];
  for (var i = 0; i < args.length; i++) arrayOfArgs.push(args[i]);
  return arrayOfArgs;
};

jasmine.util.extend = function(destination, source) {
  for (var property in source) destination[property] = source[property];
  return destination;
};

/**
 * Environment for Jasmine
 *
 * @constructor
 */
jasmine.Env = function() {
  this.currentSpec = null;
  this.currentSuite = null;
  this.currentRunner_ = new jasmine.Runner(this);

  this.reporter = new jasmine.MultiReporter();

  this.updateInterval = jasmine.DEFAULT_UPDATE_INTERVAL;
  this.defaultTimeoutInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  this.lastUpdate = 0;
  this.specFilter = function() {
    return true;
  };

  this.nextSpecId_ = 0;
  this.nextSuiteId_ = 0;
  this.equalityTesters_ = [];

  // wrap matchers
  this.matchersClass = function() {
    jasmine.Matchers.apply(this, arguments);
  };
  jasmine.util.inherit(this.matchersClass, jasmine.Matchers);

  jasmine.Matchers.wrapInto_(jasmine.Matchers.prototype, this.matchersClass);
};


jasmine.Env.prototype.setTimeout = jasmine.setTimeout;
jasmine.Env.prototype.clearTimeout = jasmine.clearTimeout;
jasmine.Env.prototype.setInterval = jasmine.setInterval;
jasmine.Env.prototype.clearInterval = jasmine.clearInterval;

/**
 * @returns an object containing jasmine version build info, if set.
 */
jasmine.Env.prototype.version = function () {
  if (jasmine.version_) {
    return jasmine.version_;
  } else {
    throw new Error('Version not set');
  }
};

/**
 * @returns string containing jasmine version build info, if set.
 */
jasmine.Env.prototype.versionString = function() {
  if (!jasmine.version_) {
    return "version unknown";
  }

  var version = this.version();
  var versionString = version.major + "." + version.minor + "." + version.build;
  if (version.release_candidate) {
    versionString += ".rc" + version.release_candidate;
  }
  versionString += " revision " + version.revision;
  return versionString;
};

/**
 * @returns a sequential integer starting at 0
 */
jasmine.Env.prototype.nextSpecId = function () {
  return this.nextSpecId_++;
};

/**
 * @returns a sequential integer starting at 0
 */
jasmine.Env.prototype.nextSuiteId = function () {
  return this.nextSuiteId_++;
};

/**
 * Register a reporter to receive status updates from Jasmine.
 * @param {jasmine.Reporter} reporter An object which will receive status updates.
 */
jasmine.Env.prototype.addReporter = function(reporter) {
  this.reporter.addReporter(reporter);
};

jasmine.Env.prototype.execute = function() {
  this.currentRunner_.execute();
};

jasmine.Env.prototype.describe = function(description, specDefinitions) {
  var suite = new jasmine.Suite(this, description, specDefinitions, this.currentSuite);

  var parentSuite = this.currentSuite;
  if (parentSuite) {
    parentSuite.add(suite);
  } else {
    this.currentRunner_.add(suite);
  }

  this.currentSuite = suite;

  var declarationError = null;
  try {
    specDefinitions.call(suite);
  } catch(e) {
    declarationError = e;
  }

  if (declarationError) {
    this.it("encountered a declaration exception", function() {
      throw declarationError;
    });
  }

  this.currentSuite = parentSuite;

  return suite;
};

jasmine.Env.prototype.beforeEach = function(beforeEachFunction) {
  if (this.currentSuite) {
    this.currentSuite.beforeEach(beforeEachFunction);
  } else {
    this.currentRunner_.beforeEach(beforeEachFunction);
  }
};

jasmine.Env.prototype.currentRunner = function () {
  return this.currentRunner_;
};

jasmine.Env.prototype.afterEach = function(afterEachFunction) {
  if (this.currentSuite) {
    this.currentSuite.afterEach(afterEachFunction);
  } else {
    this.currentRunner_.afterEach(afterEachFunction);
  }

};

jasmine.Env.prototype.xdescribe = function(desc, specDefinitions) {
  return {
    execute: function() {
    }
  };
};

jasmine.Env.prototype.it = function(description, func) {
  var spec = new jasmine.Spec(this, this.currentSuite, description);
  this.currentSuite.add(spec);
  this.currentSpec = spec;

  if (func) {
    spec.runs(func);
  }

  return spec;
};

jasmine.Env.prototype.xit = function(desc, func) {
  return {
    id: this.nextSpecId(),
    runs: function() {
    }
  };
};

jasmine.Env.prototype.compareObjects_ = function(a, b, mismatchKeys, mismatchValues) {
  if (a.__Jasmine_been_here_before__ === b && b.__Jasmine_been_here_before__ === a) {
    return true;
  }

  a.__Jasmine_been_here_before__ = b;
  b.__Jasmine_been_here_before__ = a;

  var hasKey = function(obj, keyName) {
    return obj !== null && obj[keyName] !== jasmine.undefined;
  };

  for (var property in b) {
    if (!hasKey(a, property) && hasKey(b, property)) {
      mismatchKeys.push("expected has key '" + property + "', but missing from actual.");
    }
  }
  for (property in a) {
    if (!hasKey(b, property) && hasKey(a, property)) {
      mismatchKeys.push("expected missing key '" + property + "', but present in actual.");
    }
  }
  for (property in b) {
    if (property == '__Jasmine_been_here_before__') continue;
    if (!this.equals_(a[property], b[property], mismatchKeys, mismatchValues)) {
      mismatchValues.push("'" + property + "' was '" + (b[property] ? jasmine.util.htmlEscape(b[property].toString()) : b[property]) + "' in expected, but was '" + (a[property] ? jasmine.util.htmlEscape(a[property].toString()) : a[property]) + "' in actual.");
    }
  }

  if (jasmine.isArray_(a) && jasmine.isArray_(b) && a.length != b.length) {
    mismatchValues.push("arrays were not the same length");
  }

  delete a.__Jasmine_been_here_before__;
  delete b.__Jasmine_been_here_before__;
  return (mismatchKeys.length === 0 && mismatchValues.length === 0);
};

jasmine.Env.prototype.equals_ = function(a, b, mismatchKeys, mismatchValues) {
  mismatchKeys = mismatchKeys || [];
  mismatchValues = mismatchValues || [];

  for (var i = 0; i < this.equalityTesters_.length; i++) {
    var equalityTester = this.equalityTesters_[i];
    var result = equalityTester(a, b, this, mismatchKeys, mismatchValues);
    if (result !== jasmine.undefined) return result;
  }

  if (a === b) return true;

  if (a === jasmine.undefined || a === null || b === jasmine.undefined || b === null) {
    return (a == jasmine.undefined && b == jasmine.undefined);
  }

  if (jasmine.isDomNode(a) && jasmine.isDomNode(b)) {
    return a === b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() == b.getTime();
  }

  if (a.jasmineMatches) {
    return a.jasmineMatches(b);
  }

  if (b.jasmineMatches) {
    return b.jasmineMatches(a);
  }

  if (a instanceof jasmine.Matchers.ObjectContaining) {
    return a.matches(b);
  }

  if (b instanceof jasmine.Matchers.ObjectContaining) {
    return b.matches(a);
  }

  if (jasmine.isString_(a) && jasmine.isString_(b)) {
    return (a == b);
  }

  if (jasmine.isNumber_(a) && jasmine.isNumber_(b)) {
    return (a == b);
  }

  if (typeof a === "object" && typeof b === "object") {
    return this.compareObjects_(a, b, mismatchKeys, mismatchValues);
  }

  //Straight check
  return (a === b);
};

jasmine.Env.prototype.contains_ = function(haystack, needle) {
  if (jasmine.isArray_(haystack)) {
    for (var i = 0; i < haystack.length; i++) {
      if (this.equals_(haystack[i], needle)) return true;
    }
    return false;
  }
  return haystack.indexOf(needle) >= 0;
};

jasmine.Env.prototype.addEqualityTester = function(equalityTester) {
  this.equalityTesters_.push(equalityTester);
};
/** No-op base class for Jasmine reporters.
 *
 * @constructor
 */
jasmine.Reporter = function() {
};

//noinspection JSUnusedLocalSymbols
jasmine.Reporter.prototype.reportRunnerStarting = function(runner) {
};

//noinspection JSUnusedLocalSymbols
jasmine.Reporter.prototype.reportRunnerResults = function(runner) {
};

//noinspection JSUnusedLocalSymbols
jasmine.Reporter.prototype.reportSuiteResults = function(suite) {
};

//noinspection JSUnusedLocalSymbols
jasmine.Reporter.prototype.reportSpecStarting = function(spec) {
};

//noinspection JSUnusedLocalSymbols
jasmine.Reporter.prototype.reportSpecResults = function(spec) {
};

//noinspection JSUnusedLocalSymbols
jasmine.Reporter.prototype.log = function(str) {
};

/**
 * Blocks are functions with executable code that make up a spec.
 *
 * @constructor
 * @param {jasmine.Env} env
 * @param {Function} func
 * @param {jasmine.Spec} spec
 */
jasmine.Block = function(env, func, spec) {
  this.env = env;
  this.func = func;
  this.spec = spec;
};

jasmine.Block.prototype.execute = function(onComplete) {  
  try {
    this.func.apply(this.spec);
  } catch (e) {
    this.spec.fail(e);
  }
  onComplete();
};
/** JavaScript API reporter.
 *
 * @constructor
 */
jasmine.JsApiReporter = function() {
  this.started = false;
  this.finished = false;
  this.suites_ = [];
  this.results_ = {};
};

jasmine.JsApiReporter.prototype.reportRunnerStarting = function(runner) {
  this.started = true;
  var suites = runner.topLevelSuites();
  for (var i = 0; i < suites.length; i++) {
    var suite = suites[i];
    this.suites_.push(this.summarize_(suite));
  }
};

jasmine.JsApiReporter.prototype.suites = function() {
  return this.suites_;
};

jasmine.JsApiReporter.prototype.summarize_ = function(suiteOrSpec) {
  var isSuite = suiteOrSpec instanceof jasmine.Suite;
  var summary = {
    id: suiteOrSpec.id,
    name: suiteOrSpec.description,
    type: isSuite ? 'suite' : 'spec',
    children: []
  };
  
  if (isSuite) {
    var children = suiteOrSpec.children();
    for (var i = 0; i < children.length; i++) {
      summary.children.push(this.summarize_(children[i]));
    }
  }
  return summary;
};

jasmine.JsApiReporter.prototype.results = function() {
  return this.results_;
};

jasmine.JsApiReporter.prototype.resultsForSpec = function(specId) {
  return this.results_[specId];
};

//noinspection JSUnusedLocalSymbols
jasmine.JsApiReporter.prototype.reportRunnerResults = function(runner) {
  this.finished = true;
};

//noinspection JSUnusedLocalSymbols
jasmine.JsApiReporter.prototype.reportSuiteResults = function(suite) {
};

//noinspection JSUnusedLocalSymbols
jasmine.JsApiReporter.prototype.reportSpecResults = function(spec) {
  this.results_[spec.id] = {
    messages: spec.results().getItems(),
    result: spec.results().failedCount > 0 ? "failed" : "passed"
  };
};

//noinspection JSUnusedLocalSymbols
jasmine.JsApiReporter.prototype.log = function(str) {
};

jasmine.JsApiReporter.prototype.resultsForSpecs = function(specIds){
  var results = {};
  for (var i = 0; i < specIds.length; i++) {
    var specId = specIds[i];
    results[specId] = this.summarizeResult_(this.results_[specId]);
  }
  return results;
};

jasmine.JsApiReporter.prototype.summarizeResult_ = function(result){
  var summaryMessages = [];
  var messagesLength = result.messages.length;
  for (var messageIndex = 0; messageIndex < messagesLength; messageIndex++) {
    var resultMessage = result.messages[messageIndex];
    summaryMessages.push({
      text: resultMessage.type == 'log' ? resultMessage.toString() : jasmine.undefined,
      passed: resultMessage.passed ? resultMessage.passed() : true,
      type: resultMessage.type,
      message: resultMessage.message,
      trace: {
        stack: resultMessage.passed && !resultMessage.passed() ? resultMessage.trace.stack : jasmine.undefined
      }
    });
  }

  return {
    result : result.result,
    messages : summaryMessages
  };
};

/**
 * @constructor
 * @param {jasmine.Env} env
 * @param actual
 * @param {jasmine.Spec} spec
 */
jasmine.Matchers = function(env, actual, spec, opt_isNot) {
  this.env = env;
  this.actual = actual;
  this.spec = spec;
  this.isNot = opt_isNot || false;
  this.reportWasCalled_ = false;
};

// todo: @deprecated as of Jasmine 0.11, remove soon [xw]
jasmine.Matchers.pp = function(str) {
  throw new Error("jasmine.Matchers.pp() is no longer supported, please use jasmine.pp() instead!");
};

// todo: @deprecated Deprecated as of Jasmine 0.10. Rewrite your custom matchers to return true or false. [xw]
jasmine.Matchers.prototype.report = function(result, failing_message, details) {
  throw new Error("As of jasmine 0.11, custom matchers must be implemented differently -- please see jasmine docs");
};

jasmine.Matchers.wrapInto_ = function(prototype, matchersClass) {
  for (var methodName in prototype) {
    if (methodName == 'report') continue;
    var orig = prototype[methodName];
    matchersClass.prototype[methodName] = jasmine.Matchers.matcherFn_(methodName, orig);
  }
};

jasmine.Matchers.matcherFn_ = function(matcherName, matcherFunction) {
  return function() {
    var matcherArgs = jasmine.util.argsToArray(arguments);
    var result = matcherFunction.apply(this, arguments);

    if (this.isNot) {
      result = !result;
    }

    if (this.reportWasCalled_) return result;

    var message;
    if (!result) {
      if (this.message) {
        message = this.message.apply(this, arguments);
        if (jasmine.isArray_(message)) {
          message = message[this.isNot ? 1 : 0];
        }
      } else {
        var englishyPredicate = matcherName.replace(/[A-Z]/g, function(s) { return ' ' + s.toLowerCase(); });
        message = "Expected " + jasmine.pp(this.actual) + (this.isNot ? " not " : " ") + englishyPredicate;
        if (matcherArgs.length > 0) {
          for (var i = 0; i < matcherArgs.length; i++) {
            if (i > 0) message += ",";
            message += " " + jasmine.pp(matcherArgs[i]);
          }
        }
        message += ".";
      }
    }
    var expectationResult = new jasmine.ExpectationResult({
      matcherName: matcherName,
      passed: result,
      expected: matcherArgs.length > 1 ? matcherArgs : matcherArgs[0],
      actual: this.actual,
      message: message
    });
    this.spec.addMatcherResult(expectationResult);
    return jasmine.undefined;
  };
};




/**
 * toBe: compares the actual to the expected using ===
 * @param expected
 */
jasmine.Matchers.prototype.toBe = function(expected) {
  return this.actual === expected;
};

/**
 * toNotBe: compares the actual to the expected using !==
 * @param expected
 * @deprecated as of 1.0. Use not.toBe() instead.
 */
jasmine.Matchers.prototype.toNotBe = function(expected) {
  return this.actual !== expected;
};

/**
 * toEqual: compares the actual to the expected using common sense equality. Handles Objects, Arrays, etc.
 *
 * @param expected
 */
jasmine.Matchers.prototype.toEqual = function(expected) {
  return this.env.equals_(this.actual, expected);
};

/**
 * toNotEqual: compares the actual to the expected using the ! of jasmine.Matchers.toEqual
 * @param expected
 * @deprecated as of 1.0. Use not.toEqual() instead.
 */
jasmine.Matchers.prototype.toNotEqual = function(expected) {
  return !this.env.equals_(this.actual, expected);
};

/**
 * Matcher that compares the actual to the expected using a regular expression.  Constructs a RegExp, so takes
 * a pattern or a String.
 *
 * @param expected
 */
jasmine.Matchers.prototype.toMatch = function(expected) {
  return new RegExp(expected).test(this.actual);
};

/**
 * Matcher that compares the actual to the expected using the boolean inverse of jasmine.Matchers.toMatch
 * @param expected
 * @deprecated as of 1.0. Use not.toMatch() instead.
 */
jasmine.Matchers.prototype.toNotMatch = function(expected) {
  return !(new RegExp(expected).test(this.actual));
};

/**
 * Matcher that compares the actual to jasmine.undefined.
 */
jasmine.Matchers.prototype.toBeDefined = function() {
  return (this.actual !== jasmine.undefined);
};

/**
 * Matcher that compares the actual to jasmine.undefined.
 */
jasmine.Matchers.prototype.toBeUndefined = function() {
  return (this.actual === jasmine.undefined);
};

/**
 * Matcher that compares the actual to null.
 */
jasmine.Matchers.prototype.toBeNull = function() {
  return (this.actual === null);
};

/**
 * Matcher that boolean not-nots the actual.
 */
jasmine.Matchers.prototype.toBeTruthy = function() {
  return !!this.actual;
};


/**
 * Matcher that boolean nots the actual.
 */
jasmine.Matchers.prototype.toBeFalsy = function() {
  return !this.actual;
};


/**
 * Matcher that checks to see if the actual, a Jasmine spy, was called.
 */
jasmine.Matchers.prototype.toHaveBeenCalled = function() {
  if (arguments.length > 0) {
    throw new Error('toHaveBeenCalled does not take arguments, use toHaveBeenCalledWith');
  }

  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    return [
      "Expected spy " + this.actual.identity + " to have been called.",
      "Expected spy " + this.actual.identity + " not to have been called."
    ];
  };

  return this.actual.wasCalled;
};

/** @deprecated Use expect(xxx).toHaveBeenCalled() instead */
jasmine.Matchers.prototype.wasCalled = jasmine.Matchers.prototype.toHaveBeenCalled;

/**
 * Matcher that checks to see if the actual, a Jasmine spy, was not called.
 *
 * @deprecated Use expect(xxx).not.toHaveBeenCalled() instead
 */
jasmine.Matchers.prototype.wasNotCalled = function() {
  if (arguments.length > 0) {
    throw new Error('wasNotCalled does not take arguments');
  }

  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    return [
      "Expected spy " + this.actual.identity + " to not have been called.",
      "Expected spy " + this.actual.identity + " to have been called."
    ];
  };

  return !this.actual.wasCalled;
};

/**
 * Matcher that checks to see if the actual, a Jasmine spy, was called with a set of parameters.
 *
 * @example
 *
 */
jasmine.Matchers.prototype.toHaveBeenCalledWith = function() {
  var expectedArgs = jasmine.util.argsToArray(arguments);
  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }
  this.message = function() {
    if (this.actual.callCount === 0) {
      // todo: what should the failure message for .not.toHaveBeenCalledWith() be? is this right? test better. [xw]
      return [
        "Expected spy " + this.actual.identity + " to have been called with " + jasmine.pp(expectedArgs) + " but it was never called.",
        "Expected spy " + this.actual.identity + " not to have been called with " + jasmine.pp(expectedArgs) + " but it was."
      ];
    } else {
      return [
        "Expected spy " + this.actual.identity + " to have been called with " + jasmine.pp(expectedArgs) + " but was called with " + jasmine.pp(this.actual.argsForCall),
        "Expected spy " + this.actual.identity + " not to have been called with " + jasmine.pp(expectedArgs) + " but was called with " + jasmine.pp(this.actual.argsForCall)
      ];
    }
  };

  return this.env.contains_(this.actual.argsForCall, expectedArgs);
};

/** @deprecated Use expect(xxx).toHaveBeenCalledWith() instead */
jasmine.Matchers.prototype.wasCalledWith = jasmine.Matchers.prototype.toHaveBeenCalledWith;

/** @deprecated Use expect(xxx).not.toHaveBeenCalledWith() instead */
jasmine.Matchers.prototype.wasNotCalledWith = function() {
  var expectedArgs = jasmine.util.argsToArray(arguments);
  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    return [
      "Expected spy not to have been called with " + jasmine.pp(expectedArgs) + " but it was",
      "Expected spy to have been called with " + jasmine.pp(expectedArgs) + " but it was"
    ];
  };

  return !this.env.contains_(this.actual.argsForCall, expectedArgs);
};

/**
 * Matcher that checks that the expected item is an element in the actual Array.
 *
 * @param {Object} expected
 */
jasmine.Matchers.prototype.toContain = function(expected) {
  return this.env.contains_(this.actual, expected);
};

/**
 * Matcher that checks that the expected item is NOT an element in the actual Array.
 *
 * @param {Object} expected
 * @deprecated as of 1.0. Use not.toContain() instead.
 */
jasmine.Matchers.prototype.toNotContain = function(expected) {
  return !this.env.contains_(this.actual, expected);
};

jasmine.Matchers.prototype.toBeLessThan = function(expected) {
  return this.actual < expected;
};

jasmine.Matchers.prototype.toBeGreaterThan = function(expected) {
  return this.actual > expected;
};

/**
 * Matcher that checks that the expected item is equal to the actual item
 * up to a given level of decimal precision (default 2).
 *
 * @param {Number} expected
 * @param {Number} precision
 */
jasmine.Matchers.prototype.toBeCloseTo = function(expected, precision) {
  if (!(precision === 0)) {
    precision = precision || 2;
  }
  var multiplier = Math.pow(10, precision);
  var actual = Math.round(this.actual * multiplier);
  expected = Math.round(expected * multiplier);
  return expected == actual;
};

/**
 * Matcher that checks that the expected exception was thrown by the actual.
 *
 * @param {String} expected
 */
jasmine.Matchers.prototype.toThrow = function(expected) {
  var result = false;
  var exception;
  if (typeof this.actual != 'function') {
    throw new Error('Actual is not a function');
  }
  try {
    this.actual();
  } catch (e) {
    exception = e;
  }
  if (exception) {
    result = (expected === jasmine.undefined || this.env.equals_(exception.message || exception, expected.message || expected));
  }

  var not = this.isNot ? "not " : "";

  this.message = function() {
    if (exception && (expected === jasmine.undefined || !this.env.equals_(exception.message || exception, expected.message || expected))) {
      return ["Expected function " + not + "to throw", expected ? expected.message || expected : "an exception", ", but it threw", exception.message || exception].join(' ');
    } else {
      return "Expected function to throw an exception.";
    }
  };

  return result;
};

jasmine.Matchers.Any = function(expectedClass) {
  this.expectedClass = expectedClass;
};

jasmine.Matchers.Any.prototype.jasmineMatches = function(other) {
  if (this.expectedClass == String) {
    return typeof other == 'string' || other instanceof String;
  }

  if (this.expectedClass == Number) {
    return typeof other == 'number' || other instanceof Number;
  }

  if (this.expectedClass == Function) {
    return typeof other == 'function' || other instanceof Function;
  }

  if (this.expectedClass == Object) {
    return typeof other == 'object';
  }

  return other instanceof this.expectedClass;
};

jasmine.Matchers.Any.prototype.jasmineToString = function() {
  return '<jasmine.any(' + this.expectedClass + ')>';
};

jasmine.Matchers.ObjectContaining = function (sample) {
  this.sample = sample;
};

jasmine.Matchers.ObjectContaining.prototype.jasmineMatches = function(other, mismatchKeys, mismatchValues) {
  mismatchKeys = mismatchKeys || [];
  mismatchValues = mismatchValues || [];

  var env = jasmine.getEnv();

  var hasKey = function(obj, keyName) {
    return obj != null && obj[keyName] !== jasmine.undefined;
  };

  for (var property in this.sample) {
    if (!hasKey(other, property) && hasKey(this.sample, property)) {
      mismatchKeys.push("expected has key '" + property + "', but missing from actual.");
    }
    else if (!env.equals_(this.sample[property], other[property], mismatchKeys, mismatchValues)) {
      mismatchValues.push("'" + property + "' was '" + (other[property] ? jasmine.util.htmlEscape(other[property].toString()) : other[property]) + "' in expected, but was '" + (this.sample[property] ? jasmine.util.htmlEscape(this.sample[property].toString()) : this.sample[property]) + "' in actual.");
    }
  }

  return (mismatchKeys.length === 0 && mismatchValues.length === 0);
};

jasmine.Matchers.ObjectContaining.prototype.jasmineToString = function () {
  return "<jasmine.objectContaining(" + jasmine.pp(this.sample) + ")>";
};
// Mock setTimeout, clearTimeout
// Contributed by Pivotal Computer Systems, www.pivotalsf.com

jasmine.FakeTimer = function() {
  this.reset();

  var self = this;
  self.setTimeout = function(funcToCall, millis) {
    self.timeoutsMade++;
    self.scheduleFunction(self.timeoutsMade, funcToCall, millis, false);
    return self.timeoutsMade;
  };

  self.setInterval = function(funcToCall, millis) {
    self.timeoutsMade++;
    self.scheduleFunction(self.timeoutsMade, funcToCall, millis, true);
    return self.timeoutsMade;
  };

  self.clearTimeout = function(timeoutKey) {
    self.scheduledFunctions[timeoutKey] = jasmine.undefined;
  };

  self.clearInterval = function(timeoutKey) {
    self.scheduledFunctions[timeoutKey] = jasmine.undefined;
  };

};

jasmine.FakeTimer.prototype.reset = function() {
  this.timeoutsMade = 0;
  this.scheduledFunctions = {};
  this.nowMillis = 0;
};

jasmine.FakeTimer.prototype.tick = function(millis) {
  var oldMillis = this.nowMillis;
  var newMillis = oldMillis + millis;
  this.runFunctionsWithinRange(oldMillis, newMillis);
  this.nowMillis = newMillis;
};

jasmine.FakeTimer.prototype.runFunctionsWithinRange = function(oldMillis, nowMillis) {
  var scheduledFunc;
  var funcsToRun = [];
  for (var timeoutKey in this.scheduledFunctions) {
    scheduledFunc = this.scheduledFunctions[timeoutKey];
    if (scheduledFunc != jasmine.undefined &&
        scheduledFunc.runAtMillis >= oldMillis &&
        scheduledFunc.runAtMillis <= nowMillis) {
      funcsToRun.push(scheduledFunc);
      this.scheduledFunctions[timeoutKey] = jasmine.undefined;
    }
  }

  if (funcsToRun.length > 0) {
    funcsToRun.sort(function(a, b) {
      return a.runAtMillis - b.runAtMillis;
    });
    for (var i = 0; i < funcsToRun.length; ++i) {
      try {
        var funcToRun = funcsToRun[i];
        this.nowMillis = funcToRun.runAtMillis;
        funcToRun.funcToCall();
        if (funcToRun.recurring) {
          this.scheduleFunction(funcToRun.timeoutKey,
              funcToRun.funcToCall,
              funcToRun.millis,
              true);
        }
      } catch(e) {
      }
    }
    this.runFunctionsWithinRange(oldMillis, nowMillis);
  }
};

jasmine.FakeTimer.prototype.scheduleFunction = function(timeoutKey, funcToCall, millis, recurring) {
  this.scheduledFunctions[timeoutKey] = {
    runAtMillis: this.nowMillis + millis,
    funcToCall: funcToCall,
    recurring: recurring,
    timeoutKey: timeoutKey,
    millis: millis
  };
};

/**
 * @namespace
 */
jasmine.Clock = {
  defaultFakeTimer: new jasmine.FakeTimer(),

  reset: function() {
    jasmine.Clock.assertInstalled();
    jasmine.Clock.defaultFakeTimer.reset();
  },

  tick: function(millis) {
    jasmine.Clock.assertInstalled();
    jasmine.Clock.defaultFakeTimer.tick(millis);
  },

  runFunctionsWithinRange: function(oldMillis, nowMillis) {
    jasmine.Clock.defaultFakeTimer.runFunctionsWithinRange(oldMillis, nowMillis);
  },

  scheduleFunction: function(timeoutKey, funcToCall, millis, recurring) {
    jasmine.Clock.defaultFakeTimer.scheduleFunction(timeoutKey, funcToCall, millis, recurring);
  },

  useMock: function() {
    if (!jasmine.Clock.isInstalled()) {
      var spec = jasmine.getEnv().currentSpec;
      spec.after(jasmine.Clock.uninstallMock);

      jasmine.Clock.installMock();
    }
  },

  installMock: function() {
    jasmine.Clock.installed = jasmine.Clock.defaultFakeTimer;
  },

  uninstallMock: function() {
    jasmine.Clock.assertInstalled();
    jasmine.Clock.installed = jasmine.Clock.real;
  },

  real: {
    setTimeout: jasmine.getGlobal().setTimeout,
    clearTimeout: jasmine.getGlobal().clearTimeout,
    setInterval: jasmine.getGlobal().setInterval,
    clearInterval: jasmine.getGlobal().clearInterval
  },

  assertInstalled: function() {
    if (!jasmine.Clock.isInstalled()) {
      throw new Error("Mock clock is not installed, use jasmine.Clock.useMock()");
    }
  },

  isInstalled: function() {
    return jasmine.Clock.installed == jasmine.Clock.defaultFakeTimer;
  },

  installed: null
};
jasmine.Clock.installed = jasmine.Clock.real;

//else for IE support
jasmine.getGlobal().setTimeout = function(funcToCall, millis) {
  if (jasmine.Clock.installed.setTimeout.apply) {
    return jasmine.Clock.installed.setTimeout.apply(this, arguments);
  } else {
    return jasmine.Clock.installed.setTimeout(funcToCall, millis);
  }
};

jasmine.getGlobal().setInterval = function(funcToCall, millis) {
  if (jasmine.Clock.installed.setInterval.apply) {
    return jasmine.Clock.installed.setInterval.apply(this, arguments);
  } else {
    return jasmine.Clock.installed.setInterval(funcToCall, millis);
  }
};

jasmine.getGlobal().clearTimeout = function(timeoutKey) {
  if (jasmine.Clock.installed.clearTimeout.apply) {
    return jasmine.Clock.installed.clearTimeout.apply(this, arguments);
  } else {
    return jasmine.Clock.installed.clearTimeout(timeoutKey);
  }
};

jasmine.getGlobal().clearInterval = function(timeoutKey) {
  if (jasmine.Clock.installed.clearTimeout.apply) {
    return jasmine.Clock.installed.clearInterval.apply(this, arguments);
  } else {
    return jasmine.Clock.installed.clearInterval(timeoutKey);
  }
};

/**
 * @constructor
 */
jasmine.MultiReporter = function() {
  this.subReporters_ = [];
};
jasmine.util.inherit(jasmine.MultiReporter, jasmine.Reporter);

jasmine.MultiReporter.prototype.addReporter = function(reporter) {
  this.subReporters_.push(reporter);
};

(function() {
  var functionNames = [
    "reportRunnerStarting",
    "reportRunnerResults",
    "reportSuiteResults",
    "reportSpecStarting",
    "reportSpecResults",
    "log"
  ];
  for (var i = 0; i < functionNames.length; i++) {
    var functionName = functionNames[i];
    jasmine.MultiReporter.prototype[functionName] = (function(functionName) {
      return function() {
        for (var j = 0; j < this.subReporters_.length; j++) {
          var subReporter = this.subReporters_[j];
          if (subReporter[functionName]) {
            subReporter[functionName].apply(subReporter, arguments);
          }
        }
      };
    })(functionName);
  }
})();
/**
 * Holds results for a set of Jasmine spec. Allows for the results array to hold another jasmine.NestedResults
 *
 * @constructor
 */
jasmine.NestedResults = function() {
  /**
   * The total count of results
   */
  this.totalCount = 0;
  /**
   * Number of passed results
   */
  this.passedCount = 0;
  /**
   * Number of failed results
   */
  this.failedCount = 0;
  /**
   * Was this suite/spec skipped?
   */
  this.skipped = false;
  /**
   * @ignore
   */
  this.items_ = [];
};

/**
 * Roll up the result counts.
 *
 * @param result
 */
jasmine.NestedResults.prototype.rollupCounts = function(result) {
  this.totalCount += result.totalCount;
  this.passedCount += result.passedCount;
  this.failedCount += result.failedCount;
};

/**
 * Adds a log message.
 * @param values Array of message parts which will be concatenated later.
 */
jasmine.NestedResults.prototype.log = function(values) {
  this.items_.push(new jasmine.MessageResult(values));
};

/**
 * Getter for the results: message & results.
 */
jasmine.NestedResults.prototype.getItems = function() {
  return this.items_;
};

/**
 * Adds a result, tracking counts (total, passed, & failed)
 * @param {jasmine.ExpectationResult|jasmine.NestedResults} result
 */
jasmine.NestedResults.prototype.addResult = function(result) {
  if (result.type != 'log') {
    if (result.items_) {
      this.rollupCounts(result);
    } else {
      this.totalCount++;
      if (result.passed()) {
        this.passedCount++;
      } else {
        this.failedCount++;
      }
    }
  }
  this.items_.push(result);
};

/**
 * @returns {Boolean} True if <b>everything</b> below passed
 */
jasmine.NestedResults.prototype.passed = function() {
  return this.passedCount === this.totalCount;
};
/**
 * Base class for pretty printing for expectation results.
 */
jasmine.PrettyPrinter = function() {
  this.ppNestLevel_ = 0;
};

/**
 * Formats a value in a nice, human-readable string.
 *
 * @param value
 */
jasmine.PrettyPrinter.prototype.format = function(value) {
  if (this.ppNestLevel_ > 40) {
    throw new Error('jasmine.PrettyPrinter: format() nested too deeply!');
  }

  this.ppNestLevel_++;
  try {
    if (value === jasmine.undefined) {
      this.emitScalar('undefined');
    } else if (value === null) {
      this.emitScalar('null');
    } else if (value === jasmine.getGlobal()) {
      this.emitScalar('<global>');
    } else if (value.jasmineToString) {
      this.emitScalar(value.jasmineToString());
    } else if (typeof value === 'string') {
      this.emitString(value);
    } else if (jasmine.isSpy(value)) {
      this.emitScalar("spy on " + value.identity);
    } else if (value instanceof RegExp) {
      this.emitScalar(value.toString());
    } else if (typeof value === 'function') {
      this.emitScalar('Function');
    } else if (typeof value.nodeType === 'number') {
      this.emitScalar('HTMLNode');
    } else if (value instanceof Date) {
      this.emitScalar('Date(' + value + ')');
    } else if (value.__Jasmine_been_here_before__) {
      this.emitScalar('<circular reference: ' + (jasmine.isArray_(value) ? 'Array' : 'Object') + '>');
    } else if (jasmine.isArray_(value) || typeof value == 'object') {
      value.__Jasmine_been_here_before__ = true;
      if (jasmine.isArray_(value)) {
        this.emitArray(value);
      } else {
        this.emitObject(value);
      }
      delete value.__Jasmine_been_here_before__;
    } else {
      this.emitScalar(value.toString());
    }
  } finally {
    this.ppNestLevel_--;
  }
};

jasmine.PrettyPrinter.prototype.iterateObject = function(obj, fn) {
  for (var property in obj) {
    if (property == '__Jasmine_been_here_before__') continue;
    fn(property, obj.__lookupGetter__ ? (obj.__lookupGetter__(property) !== jasmine.undefined && 
                                         obj.__lookupGetter__(property) !== null) : false);
  }
};

jasmine.PrettyPrinter.prototype.emitArray = jasmine.unimplementedMethod_;
jasmine.PrettyPrinter.prototype.emitObject = jasmine.unimplementedMethod_;
jasmine.PrettyPrinter.prototype.emitScalar = jasmine.unimplementedMethod_;
jasmine.PrettyPrinter.prototype.emitString = jasmine.unimplementedMethod_;

jasmine.StringPrettyPrinter = function() {
  jasmine.PrettyPrinter.call(this);

  this.string = '';
};
jasmine.util.inherit(jasmine.StringPrettyPrinter, jasmine.PrettyPrinter);

jasmine.StringPrettyPrinter.prototype.emitScalar = function(value) {
  this.append(value);
};

jasmine.StringPrettyPrinter.prototype.emitString = function(value) {
  this.append("'" + value + "'");
};

jasmine.StringPrettyPrinter.prototype.emitArray = function(array) {
  this.append('[ ');
  for (var i = 0; i < array.length; i++) {
    if (i > 0) {
      this.append(', ');
    }
    this.format(array[i]);
  }
  this.append(' ]');
};

jasmine.StringPrettyPrinter.prototype.emitObject = function(obj) {
  var self = this;
  this.append('{ ');
  var first = true;

  this.iterateObject(obj, function(property, isGetter) {
    if (first) {
      first = false;
    } else {
      self.append(', ');
    }

    self.append(property);
    self.append(' : ');
    if (isGetter) {
      self.append('<getter>');
    } else {
      self.format(obj[property]);
    }
  });

  this.append(' }');
};

jasmine.StringPrettyPrinter.prototype.append = function(value) {
  this.string += value;
};
jasmine.Queue = function(env) {
  this.env = env;
  this.blocks = [];
  this.running = false;
  this.index = 0;
  this.offset = 0;
  this.abort = false;
};

jasmine.Queue.prototype.addBefore = function(block) {
  this.blocks.unshift(block);
};

jasmine.Queue.prototype.add = function(block) {
  this.blocks.push(block);
};

jasmine.Queue.prototype.insertNext = function(block) {
  this.blocks.splice((this.index + this.offset + 1), 0, block);
  this.offset++;
};

jasmine.Queue.prototype.start = function(onComplete) {
  this.running = true;
  this.onComplete = onComplete;
  this.next_();
};

jasmine.Queue.prototype.isRunning = function() {
  return this.running;
};

jasmine.Queue.LOOP_DONT_RECURSE = true;

jasmine.Queue.prototype.next_ = function() {
  var self = this;
  var goAgain = true;

  while (goAgain) {
    goAgain = false;
    
    if (self.index < self.blocks.length && !this.abort) {
      var calledSynchronously = true;
      var completedSynchronously = false;

      var onComplete = function () {
        if (jasmine.Queue.LOOP_DONT_RECURSE && calledSynchronously) {
          completedSynchronously = true;
          return;
        }

        if (self.blocks[self.index].abort) {
          self.abort = true;
        }

        self.offset = 0;
        self.index++;

        var now = new Date().getTime();
        if (self.env.updateInterval && now - self.env.lastUpdate > self.env.updateInterval) {
          self.env.lastUpdate = now;
          self.env.setTimeout(function() {
            self.next_();
          }, 0);
        } else {
          if (jasmine.Queue.LOOP_DONT_RECURSE && completedSynchronously) {
            goAgain = true;
          } else {
            self.next_();
          }
        }
      };
      self.blocks[self.index].execute(onComplete);

      calledSynchronously = false;
      if (completedSynchronously) {
        onComplete();
      }
      
    } else {
      self.running = false;
      if (self.onComplete) {
        self.onComplete();
      }
    }
  }
};

jasmine.Queue.prototype.results = function() {
  var results = new jasmine.NestedResults();
  for (var i = 0; i < this.blocks.length; i++) {
    if (this.blocks[i].results) {
      results.addResult(this.blocks[i].results());
    }
  }
  return results;
};


/**
 * Runner
 *
 * @constructor
 * @param {jasmine.Env} env
 */
jasmine.Runner = function(env) {
  var self = this;
  self.env = env;
  self.queue = new jasmine.Queue(env);
  self.before_ = [];
  self.after_ = [];
  self.suites_ = [];
};

jasmine.Runner.prototype.execute = function() {
  var self = this;
  if (self.env.reporter.reportRunnerStarting) {
    self.env.reporter.reportRunnerStarting(this);
  }
  self.queue.start(function () {
    self.finishCallback();
  });
};

jasmine.Runner.prototype.beforeEach = function(beforeEachFunction) {
  beforeEachFunction.typeName = 'beforeEach';
  this.before_.splice(0,0,beforeEachFunction);
};

jasmine.Runner.prototype.afterEach = function(afterEachFunction) {
  afterEachFunction.typeName = 'afterEach';
  this.after_.splice(0,0,afterEachFunction);
};


jasmine.Runner.prototype.finishCallback = function() {
  this.env.reporter.reportRunnerResults(this);
};

jasmine.Runner.prototype.addSuite = function(suite) {
  this.suites_.push(suite);
};

jasmine.Runner.prototype.add = function(block) {
  if (block instanceof jasmine.Suite) {
    this.addSuite(block);
  }
  this.queue.add(block);
};

jasmine.Runner.prototype.specs = function () {
  var suites = this.suites();
  var specs = [];
  for (var i = 0; i < suites.length; i++) {
    specs = specs.concat(suites[i].specs());
  }
  return specs;
};

jasmine.Runner.prototype.suites = function() {
  return this.suites_;
};

jasmine.Runner.prototype.topLevelSuites = function() {
  var topLevelSuites = [];
  for (var i = 0; i < this.suites_.length; i++) {
    if (!this.suites_[i].parentSuite) {
      topLevelSuites.push(this.suites_[i]);
    }
  }
  return topLevelSuites;
};

jasmine.Runner.prototype.results = function() {
  return this.queue.results();
};
/**
 * Internal representation of a Jasmine specification, or test.
 *
 * @constructor
 * @param {jasmine.Env} env
 * @param {jasmine.Suite} suite
 * @param {String} description
 */
jasmine.Spec = function(env, suite, description) {
  if (!env) {
    throw new Error('jasmine.Env() required');
  }
  if (!suite) {
    throw new Error('jasmine.Suite() required');
  }
  var spec = this;
  spec.id = env.nextSpecId ? env.nextSpecId() : null;
  spec.env = env;
  spec.suite = suite;
  spec.description = description;
  spec.queue = new jasmine.Queue(env);

  spec.afterCallbacks = [];
  spec.spies_ = [];

  spec.results_ = new jasmine.NestedResults();
  spec.results_.description = description;
  spec.matchersClass = null;
};

jasmine.Spec.prototype.getFullName = function() {
  return this.suite.getFullName() + ' ' + this.description + '.';
};


jasmine.Spec.prototype.results = function() {
  return this.results_;
};

/**
 * All parameters are pretty-printed and concatenated together, then written to the spec's output.
 *
 * Be careful not to leave calls to <code>jasmine.log</code> in production code.
 */
jasmine.Spec.prototype.log = function() {
  return this.results_.log(arguments);
};

jasmine.Spec.prototype.runs = function (func) {
  var block = new jasmine.Block(this.env, func, this);
  this.addToQueue(block);
  return this;
};

jasmine.Spec.prototype.addToQueue = function (block) {
  if (this.queue.isRunning()) {
    this.queue.insertNext(block);
  } else {
    this.queue.add(block);
  }
};

/**
 * @param {jasmine.ExpectationResult} result
 */
jasmine.Spec.prototype.addMatcherResult = function(result) {
  this.results_.addResult(result);
};

jasmine.Spec.prototype.expect = function(actual) {
  var positive = new (this.getMatchersClass_())(this.env, actual, this);
  positive.not = new (this.getMatchersClass_())(this.env, actual, this, true);
  return positive;
};

/**
 * Waits a fixed time period before moving to the next block.
 *
 * @deprecated Use waitsFor() instead
 * @param {Number} timeout milliseconds to wait
 */
jasmine.Spec.prototype.waits = function(timeout) {
  var waitsFunc = new jasmine.WaitsBlock(this.env, timeout, this);
  this.addToQueue(waitsFunc);
  return this;
};

/**
 * Waits for the latchFunction to return true before proceeding to the next block.
 *
 * @param {Function} latchFunction
 * @param {String} optional_timeoutMessage
 * @param {Number} optional_timeout
 */
jasmine.Spec.prototype.waitsFor = function(latchFunction, optional_timeoutMessage, optional_timeout) {
  var latchFunction_ = null;
  var optional_timeoutMessage_ = null;
  var optional_timeout_ = null;

  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    switch (typeof arg) {
      case 'function':
        latchFunction_ = arg;
        break;
      case 'string':
        optional_timeoutMessage_ = arg;
        break;
      case 'number':
        optional_timeout_ = arg;
        break;
    }
  }

  var waitsForFunc = new jasmine.WaitsForBlock(this.env, optional_timeout_, latchFunction_, optional_timeoutMessage_, this);
  this.addToQueue(waitsForFunc);
  return this;
};

jasmine.Spec.prototype.fail = function (e) {
  var expectationResult = new jasmine.ExpectationResult({
    passed: false,
    message: e ? jasmine.util.formatException(e) : 'Exception',
    trace: { stack: e.stack }
  });
  this.results_.addResult(expectationResult);
};

jasmine.Spec.prototype.getMatchersClass_ = function() {
  return this.matchersClass || this.env.matchersClass;
};

jasmine.Spec.prototype.addMatchers = function(matchersPrototype) {
  var parent = this.getMatchersClass_();
  var newMatchersClass = function() {
    parent.apply(this, arguments);
  };
  jasmine.util.inherit(newMatchersClass, parent);
  jasmine.Matchers.wrapInto_(matchersPrototype, newMatchersClass);
  this.matchersClass = newMatchersClass;
};

jasmine.Spec.prototype.finishCallback = function() {
  this.env.reporter.reportSpecResults(this);
};

jasmine.Spec.prototype.finish = function(onComplete) {
  this.removeAllSpies();
  this.finishCallback();
  if (onComplete) {
    onComplete();
  }
};

jasmine.Spec.prototype.after = function(doAfter) {
  if (this.queue.isRunning()) {
    this.queue.add(new jasmine.Block(this.env, doAfter, this));
  } else {
    this.afterCallbacks.unshift(doAfter);
  }
};

jasmine.Spec.prototype.execute = function(onComplete) {
  var spec = this;
  if (!spec.env.specFilter(spec)) {
    spec.results_.skipped = true;
    spec.finish(onComplete);
    return;
  }

  this.env.reporter.reportSpecStarting(this);

  spec.env.currentSpec = spec;

  spec.addBeforesAndAftersToQueue();

  spec.queue.start(function () {
    spec.finish(onComplete);
  });
};

jasmine.Spec.prototype.addBeforesAndAftersToQueue = function() {
  var runner = this.env.currentRunner();
  var i;

  for (var suite = this.suite; suite; suite = suite.parentSuite) {
    for (i = 0; i < suite.before_.length; i++) {
      this.queue.addBefore(new jasmine.Block(this.env, suite.before_[i], this));
    }
  }
  for (i = 0; i < runner.before_.length; i++) {
    this.queue.addBefore(new jasmine.Block(this.env, runner.before_[i], this));
  }
  for (i = 0; i < this.afterCallbacks.length; i++) {
    this.queue.add(new jasmine.Block(this.env, this.afterCallbacks[i], this));
  }
  for (suite = this.suite; suite; suite = suite.parentSuite) {
    for (i = 0; i < suite.after_.length; i++) {
      this.queue.add(new jasmine.Block(this.env, suite.after_[i], this));
    }
  }
  for (i = 0; i < runner.after_.length; i++) {
    this.queue.add(new jasmine.Block(this.env, runner.after_[i], this));
  }
};

jasmine.Spec.prototype.explodes = function() {
  throw 'explodes function should not have been called';
};

jasmine.Spec.prototype.spyOn = function(obj, methodName, ignoreMethodDoesntExist) {
  if (obj == jasmine.undefined) {
    throw "spyOn could not find an object to spy upon for " + methodName + "()";
  }

  if (!ignoreMethodDoesntExist && obj[methodName] === jasmine.undefined) {
    throw methodName + '() method does not exist';
  }

  if (!ignoreMethodDoesntExist && obj[methodName] && obj[methodName].isSpy) {
    throw new Error(methodName + ' has already been spied upon');
  }

  var spyObj = jasmine.createSpy(methodName);

  this.spies_.push(spyObj);
  spyObj.baseObj = obj;
  spyObj.methodName = methodName;
  spyObj.originalValue = obj[methodName];

  obj[methodName] = spyObj;

  return spyObj;
};

jasmine.Spec.prototype.removeAllSpies = function() {
  for (var i = 0; i < this.spies_.length; i++) {
    var spy = this.spies_[i];
    spy.baseObj[spy.methodName] = spy.originalValue;
  }
  this.spies_ = [];
};

/**
 * Internal representation of a Jasmine suite.
 *
 * @constructor
 * @param {jasmine.Env} env
 * @param {String} description
 * @param {Function} specDefinitions
 * @param {jasmine.Suite} parentSuite
 */
jasmine.Suite = function(env, description, specDefinitions, parentSuite) {
  var self = this;
  self.id = env.nextSuiteId ? env.nextSuiteId() : null;
  self.description = description;
  self.queue = new jasmine.Queue(env);
  self.parentSuite = parentSuite;
  self.env = env;
  self.before_ = [];
  self.after_ = [];
  self.children_ = [];
  self.suites_ = [];
  self.specs_ = [];
};

jasmine.Suite.prototype.getFullName = function() {
  var fullName = this.description;
  for (var parentSuite = this.parentSuite; parentSuite; parentSuite = parentSuite.parentSuite) {
    fullName = parentSuite.description + ' ' + fullName;
  }
  return fullName;
};

jasmine.Suite.prototype.finish = function(onComplete) {
  this.env.reporter.reportSuiteResults(this);
  this.finished = true;
  if (typeof(onComplete) == 'function') {
    onComplete();
  }
};

jasmine.Suite.prototype.beforeEach = function(beforeEachFunction) {
  beforeEachFunction.typeName = 'beforeEach';
  this.before_.unshift(beforeEachFunction);
};

jasmine.Suite.prototype.afterEach = function(afterEachFunction) {
  afterEachFunction.typeName = 'afterEach';
  this.after_.unshift(afterEachFunction);
};

jasmine.Suite.prototype.results = function() {
  return this.queue.results();
};

jasmine.Suite.prototype.add = function(suiteOrSpec) {
  this.children_.push(suiteOrSpec);
  if (suiteOrSpec instanceof jasmine.Suite) {
    this.suites_.push(suiteOrSpec);
    this.env.currentRunner().addSuite(suiteOrSpec);
  } else {
    this.specs_.push(suiteOrSpec);
  }
  this.queue.add(suiteOrSpec);
};

jasmine.Suite.prototype.specs = function() {
  return this.specs_;
};

jasmine.Suite.prototype.suites = function() {
  return this.suites_;
};

jasmine.Suite.prototype.children = function() {
  return this.children_;
};

jasmine.Suite.prototype.execute = function(onComplete) {
  var self = this;
  this.queue.start(function () {
    self.finish(onComplete);
  });
};
jasmine.WaitsBlock = function(env, timeout, spec) {
  this.timeout = timeout;
  jasmine.Block.call(this, env, null, spec);
};

jasmine.util.inherit(jasmine.WaitsBlock, jasmine.Block);

jasmine.WaitsBlock.prototype.execute = function (onComplete) {
  if (jasmine.VERBOSE) {
    this.env.reporter.log('>> Jasmine waiting for ' + this.timeout + ' ms...');
  }
  this.env.setTimeout(function () {
    onComplete();
  }, this.timeout);
};
/**
 * A block which waits for some condition to become true, with timeout.
 *
 * @constructor
 * @extends jasmine.Block
 * @param {jasmine.Env} env The Jasmine environment.
 * @param {Number} timeout The maximum time in milliseconds to wait for the condition to become true.
 * @param {Function} latchFunction A function which returns true when the desired condition has been met.
 * @param {String} message The message to display if the desired condition hasn't been met within the given time period.
 * @param {jasmine.Spec} spec The Jasmine spec.
 */
jasmine.WaitsForBlock = function(env, timeout, latchFunction, message, spec) {
  this.timeout = timeout || env.defaultTimeoutInterval;
  this.latchFunction = latchFunction;
  this.message = message;
  this.totalTimeSpentWaitingForLatch = 0;
  jasmine.Block.call(this, env, null, spec);
};
jasmine.util.inherit(jasmine.WaitsForBlock, jasmine.Block);

jasmine.WaitsForBlock.TIMEOUT_INCREMENT = 10;

jasmine.WaitsForBlock.prototype.execute = function(onComplete) {
  if (jasmine.VERBOSE) {
    this.env.reporter.log('>> Jasmine waiting for ' + (this.message || 'something to happen'));
  }
  var latchFunctionResult;
  try {
    latchFunctionResult = this.latchFunction.apply(this.spec);
  } catch (e) {
    this.spec.fail(e);
    onComplete();
    return;
  }

  if (latchFunctionResult) {
    onComplete();
  } else if (this.totalTimeSpentWaitingForLatch >= this.timeout) {
    var message = 'timed out after ' + this.timeout + ' msec waiting for ' + (this.message || 'something to happen');
    this.spec.fail({
      name: 'timeout',
      message: message
    });

    this.abort = true;
    onComplete();
  } else {
    this.totalTimeSpentWaitingForLatch += jasmine.WaitsForBlock.TIMEOUT_INCREMENT;
    var self = this;
    this.env.setTimeout(function() {
      self.execute(onComplete);
    }, jasmine.WaitsForBlock.TIMEOUT_INCREMENT);
  }
};

jasmine.version_= {
  "major": 1,
  "minor": 2,
  "build": 0,
  "revision": 1337005947
};

}
/**
 * Simple implementation of AMD require/define assuming all
 * modules are named and loaded explicitly, and require is called
 * after all needed modules have been loaded.
 */
(function (window) {
    var ns = window.jasmineui = window.jasmineui || {};

    var define = function (name, deps, value) {
        var dotJs = name.indexOf('.js');
        if (dotJs !== -1) {
            name = name.substring(0, dotJs);
        }
        if (arguments.length == 2) {
            // No deps...
            value = deps;
            deps = [];
        }
        var def = {
            name:name,
            deps:deps,
            value:value
        };
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name === name) {
                define.moduleDefs[i] = def;
                return;
            }
        }
        define.moduleDefs.push(def);
    };
    define.moduleDefs = [];
    define.plugins = {
        factory:factoryPlugin
    };
    define.conditionals = {
        client:function () {
            return !!document.documentElement.getAttribute("jasmineuiClient");
        },
        server:function () {
            return !define.conditionals.client();
        }
    };

    function findModuleDefinition(name) {
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name == name) {
                return mod;
            }
        }
        throw new Error("Could not find the module " + name);
    }

    function plugin(pluginName, moduleName) {
        var p = define.plugins[pluginName];
        if (!p) {
            throw new Error("Unknown plugin " + pluginName);
        }
        return p(moduleName);
    }

    function factoryPlugin(moduleName) {
        return function (cache) {
            cache = cache || {};
            return factory(moduleName, cache);
        }
    }

    function factory(name, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        if (instanceCache[name] === undefined) {
            var resolvedValue;
            var pluginSeparator = name.indexOf('!');
            if (pluginSeparator !== -1) {
                var pluginName = name.substring(0, pluginSeparator);
                var moduleName = name.substring(pluginSeparator + 1);
                resolvedValue = plugin(pluginName, moduleName);
            } else {
                // Normal locally defined modules.
                var mod = findModuleDefinition(name);
                var resolvedDeps = listFactory(mod.deps, instanceCache);
                resolvedValue = mod.value;
                if (typeof mod.value === 'function') {
                    resolvedValue = mod.value.apply(window, resolvedDeps);
                }
            }

            instanceCache[name] = resolvedValue;
            if (resolvedValue && resolvedValue.globals) {
                var globals = factory('globals', instanceCache);
                mergeObjects(resolvedValue.globals, globals);

            }

        }
        return instanceCache[name];
    }

    function mergeObjects(source, target) {
        var prop, oldValue, newValue;
        for (prop in source) {
            newValue = source[prop];
            oldValue = target[prop];
            if (typeof oldValue === 'object') {
                mergeObjects(newValue, oldValue);
            } else {
                target[prop] = newValue;
            }
        }
    }

    function listFactory(deps, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        var resolvedDeps = [];
        for (var i = 0; i < deps.length; i++) {
            resolvedDeps.push(factory(deps[i], instanceCache));
        }
        return resolvedDeps;
    }

    var require = function (deps, callback) {
        var resolvedDeps = listFactory(deps, require.cache);
        // Note: testing if typeof callback==="function" does not work
        // in IE9 from remote window (then everything is an object...)
        if (callback && callback.apply) {
            callback.apply(this, resolvedDeps);
        }
        return resolvedDeps;
    };

    require.all = function (filter, callback) {
        var i, def;
        var modules = {};
        for (i = 0; i < define.moduleDefs.length; i++) {
            def = define.moduleDefs[i];
            if (filter(def.name)) {
                require([def.name], function (module) {
                    modules[def.name] = module;
                });
            }
        }
        callback && callback(modules);
    };

    var CLIENT_RE = /client\//;
    var SERVER_RE = /server\//;
    require.default = function (callback) {
        var isClient = document.documentElement.dataset.jasmineui;
        require.all(function (name) {
            if (isClient) {
                return !name.match(SERVER_RE);
            } else {
                return !name.match(CLIENT_RE);
            }
        }, callback);
    };

    require.cache = {};

    ns.require = require;
    ns.define = define;

})(window);

jasmineui.define('config', ['globals', 'persistentData'], function (globals, persistentData) {
    var pd = persistentData();

    var config = {
        logEnabled:false,
        asyncSensors:['load', 'timeout', 'interval', 'xhr', '$animationComplete', '$transitionComplete'],
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
jasmineui.define('urlLoader', ['persistentData'], function (persistentData) {
    function parseUrl(url) {
        var hashIndex = url.indexOf('#');
        var hash;
        var query = '';
        if (hashIndex != -1) {
            hash = url.substring(hashIndex + 1);
            url = url.substring(0, hashIndex);
        }
        var queryIndex = url.indexOf('?');
        if (queryIndex != -1) {
            query = url.substring(queryIndex + 1);
            url = url.substring(0, queryIndex);
        }
        return {
            baseUrl:url,
            hash:hash,
            query:query?query.split('&'):[]
        }
    }

    function serializeUrl(parsedUrl) {
        var res = parsedUrl.baseUrl;
        if (parsedUrl.query && parsedUrl.query.length) {
            res += '?' + parsedUrl.query.join('&');
        }
        if (parsedUrl.hash) {
            res += '#' + parsedUrl.hash;
        }
        return res;
    }

    function setOrReplaceQueryAttr(parsedUrl, attr, value) {
        var newQueryEntry = attr + '='+ value;
        var query = parsedUrl.query;
        for (var i = 0; i < query.length; i++) {
            if (query[i].indexOf(attr) === 0) {
                query[i] = newQueryEntry;
                return;
            }
        }
        query.push(newQueryEntry);
    }

    var refreshUrlAttribute = 'juir';

    function navigateWithReloadTo(win, url) {
        var data = persistentData();
        var parsedUrl = parseUrl(url);
        var refreshCount = data.refreshCount = (data.refreshCount || 0) + 1;
        setOrReplaceQueryAttr(parsedUrl, refreshUrlAttribute, refreshCount);
        persistentData.saveDataToWindow(win);
        win.location.href = serializeUrl(parsedUrl);
    }

    return {
        navigateWithReloadTo: navigateWithReloadTo,
        setOrReplaceQueryAttr: setOrReplaceQueryAttr,
        parseUrl: parseUrl,
        serializeUrl: serializeUrl
    };
});
jasmineui.define('scriptAccessor', ['globals'], function (globals) {

    function currentScriptUrl() {
        // Note: This also works with js-test-driver:
        // as js-test-driver loads one script after the other, and appends the
        // script at the end of the head tag.
        var scriptNodes = globals.document.getElementsByTagName("script");
        var lastNode = scriptNodes[scriptNodes.length - 1];
        if (!lastNode.src) {
            // Use data url...
            return "data:text/javascript;charset=utf-8,"+encodeURIComponent(lastNode.textContent);
        }
        return lastNode.src;
    }

    return {
        currentScriptUrl:currentScriptUrl
    }
});
jasmineui.define('logger', ['globals', 'config'], function (globals, config) {
    function log(msg1, msg2, msg3) {
        if (config.logEnabled) {
            // Note: console.log does not support .apply!
            if (arguments.length === 1) {
                globals.console.log(msg1);
            }
            if (arguments.length === 2) {
                globals.console.log(msg1, msg2);
            }
            if (arguments.length === 3) {
                globals.console.log(msg1, msg2, msg3);
            }
        }
    }

    return {
        log:log
    };

});
jasmineui.define('globals', function () {
    return window;
});
jasmineui.define('persistentData', ['globals', 'instrumentor'], function (globals, instrumentor) {

    function getOwnerData() {
        var owner = globals.opener || globals.parent;
        return  owner && owner.jasmineui && owner.jasmineui.persistent;
    }

    var ownerData = getOwnerData();


    function get() {
        var win = globals;
        var res = win.jasmineui && win.jasmineui.persistent;
        if (!res) {
            win.jasmineui = win.jasmineui || {};
            if (ownerData) {
                win.jasmineui.persistent = ownerData;
                res = ownerData;
            } else {
                try {
                    res = win.jasmineui.persistent = JSON.parse(win.sessionStorage.jasmineui_data || '{}');
                } finally {
                    delete win.sessionStorage.jasmineui_data;
                }
            }
        }
        return res;
    }

    function setSessionStorage(target, property, value) {
        if (target === globals) {
            target.sessionStorage[property] = value;
        } else {
            // Note: in IE9 we cannot access target.sessionStorage directly,
            // so we need to use eval to set it :-(
            target.tmp = value;
            target.eval("sessionStorage." + property + " = window.tmp;");
        }
    }

    function saveDataToWindow(target) {
        var loaderString = instrumentor.loaderScript();
        setSessionStorage(target, "jasmineui", loaderString);
        if (!ownerData) {
            var dataString = JSON.stringify(get());
            setSessionStorage(target, "jasmineui_data", dataString);
        }
    }

    get.saveDataToWindow = saveDataToWindow;

    return get;
});
jasmineui.define('instrumentor', ['scriptAccessor', 'globals'], function (scriptAccessor, globals) {

    var jasmineUiScriptUrl = scriptAccessor.currentScriptUrl();

    function loaderScript() {
        var helper = function (window) {
            // Groups:
            // 1. text of all element attributes
            // 2. content of src attribute
            // 3. text content of script element.
            var SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>(.*?)<\/script>/;

            stopLoad();
            var pageHtml = readDocument();
            pageHtml = modifyHtml(pageHtml);
            replaceDocument(pageHtml);

            function stopLoad() {
                if (window.stop) {
                    window.stop();
                } else {
                    // IE
                    window.document.execCommand('Stop');
                }
            }

            function readDocument() {
                var xhr = new window.XMLHttpRequest();
                xhr.open("GET", window.location.href, false);
                xhr.send();
                return xhr.responseText;
            }

            function replaceDocument(pageHtml) {
                window.document.open();
                window.document.write(pageHtml);
                window.document.close();
            }

            function urlScript(url) {
                return '<script type="text/javascript" src="' + url + '"></script>';
            }

            function inlineScript(content) {
                return '<script type="text/javascript">' + content + '</script>';
            }

            function modifyHtml(pageHtml) {
                pageHtml = pageHtml.replace("<html", '<html data-jasmineui="true"');
                pageHtml = pageHtml.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
                    if (textContent.indexOf('sessionStorage.jasmineui') != -1) {
                        return urlScript('JASMINEUI_SCRIPT_URL');
                    } else if (srcAttribute) {
                        return inlineScript('jasmineui.instrumentor.urlScript("' + srcAttribute + '")');
                    } else {
                        textContent = textContent.replace(/"/g, '\\"');
                        return inlineScript('jasmineui.instrumentor.inlineScript("' + textContent + '")');
                    }
                });
                pageHtml = pageHtml.replace("</body>", inlineScript('jasmineui.instrumentor.endScripts()') +
                    inlineScript('jasmineui.instrumentor.endCalls()')+ '</body>');
                return pageHtml;
            }
        };
        var script = "(" + helper + ")(window) //@ instrumentor.js";
        return script.replace('JASMINEUI_SCRIPT_URL', jasmineUiScriptUrl);
    }

    function urlScript(url) {
        return '<script type="text/javascript" src="' + url + '"></script>';
    }

    function beginScript(url) {
        globals.document.write(urlScript(url));
    }

    var endScripts = [];
    var endCalls = [];

    function endScript(url) {
        endScripts.push(url);
    }

    function endCall(callback) {
        endCalls.push(callback);
    }

    var originalRequire;

    function checkForRequireJs() {
        if (originalRequire) {
            return true;
        }
        if (globals.require) {
            originalRequire = globals.require;
            globals.require = function (deps, originalCallback) {
                deps.push('require');
                originalRequire(deps, function () {
                    var originalArgs = Array.prototype.slice.call(arguments);
                    var localRequire = originalArgs[originalArgs.length - 1];
                    localRequire(endScripts, function () {
                        for (i = 0; i < endCalls.length; i++) {
                            endCalls[i]();
                        }
                        originalCallback.apply(globals, originalArgs.slice(0, originalArgs.length - 1));
                    });
                });
            };
            return true;
        }
    }

    function instrumentFunction() {

    }

    function onInlineScript(evalString) {
        checkForRequireJs();
    }

    function onUrlScript(url) {
        checkForRequireJs();
    }

    function onEndScripts() {
        if (checkForRequireJs()) {
            return
        }

        var i;
        for (i = 0; i < endScripts.length; i++) {
            globals.document.write(urlScript(endScripts[i]));
        }
    }

    function onEndCalls() {
        if (checkForRequireJs()) {
            return
        }

        var i;
        for (i = 0; i < endCalls.length; i++) {
            endCalls[i]();
        }
    }

    // public API
    return {
        globals: {
            jasmineui: {
                // private API as callback from loaderScript
                instrumentor: {
                    endScripts:onEndScripts,
                    endCalls:onEndCalls,
                    inlineScript:onInlineScript,
                    urlScript:onUrlScript
                }
            }
        },
        loaderScript:loaderScript,
        beginScript:beginScript,
        endScript:endScript,
        endCall:endCall,
        instrumentFunction:instrumentFunction
    }

});
jasmineui.define('client/asyncSensor', ['globals', 'logger', 'instrumentor', 'config'], function (globals, logger, instrumentor, config) {
    var oldTimeout = globals.setTimeout;
    var oldClearTimeout = globals.clearTimeout;
    var oldClearInterval = globals.clearInterval;
    var oldSetInterval = globals.setInterval;

    var asyncSensorStates = {};

    var asyncStateListeners = [];

    /**
     * Updates the state of a sensor.
     *
     * @param name
     * @param asyncProcessing Whether the sensor detected async processing.
     */
    function updateSensor(name, asyncProcessing) {
        asyncSensorStates[name] = asyncProcessing;
        logger.log("async wait state changed: " + name + "=" + asyncProcessing, asyncSensorStates);
        checkAndCallAsyncListeners();
    }

    function waitForAsyncProcessingState(state, listener) {
        asyncStateListeners.push({asyncProcessing:state, listener:listener});
        checkAndCallAsyncListeners();
    }

    function checkAndCallAsyncListeners() {
        var asyncProcessing = isAsyncProcessing();
        var i, entry;
        for (i = asyncStateListeners.length - 1; i >= 0; i--) {
            entry = asyncStateListeners[i];
            if (entry.asyncProcessing === asyncProcessing) {
                asyncStateListeners.splice(i, 1);
                entry.listener();
            }
        }
    }

    function isAsyncProcessing() {
        var i , sensorName;
        var asyncProcessing = false;
        for (i = 0; i < config.asyncSensors.length; i++) {
            sensorName = config.asyncSensors[i];
            if (asyncSensorStates[sensorName]) {
                return true;
            }
        }
        return false;
    }

    // Goal:
    // - Detect async work that cannot detected before some time after it's start
    //   (e.g. the WebKitAnimationStart event is not fired until some ms after the dom change that started the animation).
    // - Detect the situation where async work starts another async work
    //
    // Algorithm:
    // Wait until asyncSensor is false for 50ms.
    function afterAsync(listener) {
        function restart() {
            logger.log("begin async waiting");
            waitForAsyncProcessingState(false, function () {
                var handle = oldTimeout(function () {
                    logger.log("end async waiting");
                    listener();
                }, 50);
                waitForAsyncProcessingState(true, function () {
                    oldClearTimeout(handle);
                    restart();
                });
            });
        }

        restart();
    }

    /**
     * Adds an async sensor for the load event
     */
    (function () {
        var loadEvent = false;
        var endCall = false;
        globals.addEventListener('load', function () {
            // Also listen for the globals.load event, as instrumentor.endCall
            // is fired before all images, ... are loaded (in non requirejs case).
            loadEvent = true;
            changed();
        });
        instrumentor.endCall(function () {
            // Note: endCall is called before the real application starts.
            // However, it supports requirejs.
            oldTimeout(function () {
                endCall = true;
                changed();
            }, 10);
        });
        function changed() {
            updateSensor('load', !loadEvent || !endCall);
        }
        changed();
    })();

    /**
     * Adds an async sensor for the globals.setTimeout function.
     */
    (function () {
        var timeouts = {};
        globals.setTimeout = function (fn, time) {
            var handle;
            var callback = function () {
                delete timeouts[handle];
                changed();
                if (typeof fn == 'string') {
                    eval(fn);
                } else {
                    fn();
                }
            };
            handle = oldTimeout(callback, time);
            timeouts[handle] = true;
            changed();
            return handle;
        };

        globals.clearTimeout = function (code) {
            oldClearTimeout(code);
            delete timeouts[code];
            changed();
        };
        function changed() {
            var count = 0;
            for (var x in timeouts) {
                count++;
            }
            updateSensor('timeout', count != 0);
        }
    })();

    /**
     * Adds an async sensor for the globals.setInterval function.
     */
    (function () {
        var intervals = {};
        globals.setInterval = function (fn, time) {
            var callback = function () {
                if (typeof fn == 'string') {
                    eval(fn);
                } else {
                    fn();
                }
            };
            var res = oldSetInterval(callback, time);
            intervals[res] = 'true';
            changed();
            return res;
        };

        globals.clearInterval = function (code) {
            oldClearInterval(code);
            delete intervals[code];
            changed();
        };

        function changed() {
            var count = 0;
            for (var x in intervals) {
                count++;
            }
            updateSensor('interval', count != 0);
        }
    })();

    /**
     * Adds an async sensor for the globals.XMLHttpRequest.
     */
    (function () {
        var jasmineWindow = window;
        var copyStateFields = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
        var proxyMethods = ['abort', 'getAllResponseHeaders', 'getResponseHader', 'open', 'send', 'setRequestHeader'];

        var oldXHR = globals.XMLHttpRequest;
        globals.openCallCount = 0;
        var DONE = 4;
        var newXhr = function () {
            var self = this;
            this.origin = new oldXHR();

            function copyState() {
                for (var i = 0; i < copyStateFields.length; i++) {
                    var field = copyStateFields[i];
                    try {
                        self[field] = self.origin[field];
                    } catch (_) {
                    }
                }
            }

            function proxyMethod(name) {
                self[name] = function () {
                    if (name == 'send') {
                        change(1);
                    }
                    var res = self.origin[name].apply(self.origin, arguments);
                    copyState();
                    return res;
                }
            }

            for (var i = 0; i < proxyMethods.length; i++) {
                proxyMethod(proxyMethods[i]);
            }
            this.origin.onreadystatechange = function () {
                if (self.origin.readyState == DONE) {
                    change(-1);
                }
                copyState();
                if (self.onreadystatechange) {
                    self.onreadystatechange.apply(self.origin, arguments);
                }
            };
            copyState();
        };
        globals.XMLHttpRequest = newXhr;

        function change(difference) {
            globals.openCallCount += difference;
            updateSensor('xhr', globals.openCallCount != 0);
        }
    })();

    /**
     * Adds an async sensor for $.fn.animationComplete.
     */
    (function () {
        var animationCount = 0;
        instrumentor.endCall(function () {
            if (!(globals.$ && globals.$.fn && globals.$.fn.animationComplete)) {
                return;
            }
            var oldFn = globals.$.fn.animationComplete;
            globals.$.fn.animationComplete = function (callback) {
                change(1);
                return oldFn.call(this, function () {
                    change(-1);
                    return callback.apply(this, arguments);
                });
            };
            function change(difference) {
                animationCount += difference;
                updateSensor('$animationComplete', animationCount != 0);
            }
        });

    })();

    /**
     * Adds an async sensor for $.fn.transitionComplete.
     */
    (function () {
        var transitionCount = 0;
        instrumentor.endCall(function () {
            if (!(globals.$ && globals.$.fn && globals.$.fn.transitionComplete)) {
                return;
            }

            var oldFn = globals.$.fn.transitionComplete;
            globals.$.fn.transitionComplete = function (callback) {
                change(1);
                return oldFn.call(this, function () {
                    change(-1);
                    return callback.apply(this, arguments);
                });
            };
            function change(difference) {
                transitionCount += difference;
                updateSensor('$transitionComplete', transitionCount != 0);
            }
        });
    })();


    return {
        updateSensor:updateSensor,
        afterAsync:afterAsync
    };
});
jasmineui.define('client/simulateEvent', ['globals'], function (globals) {
    /**
     * Functions to simulate events.
     * Based upon https://github.com/jquery/jquery-ui/blob/master/tests/jquery.simulate.js
     * Can also handle elements from different frames.
     * <p>
     * Provides:
     * simulate(el, type, options)
     */
    function simulate(el, type, options) {
        options = extend({}, simulate.defaults, options || {});
        var document = el.ownerDocument;
        simulateEvent(document, el, type, options);
    }

    function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                target[key] = obj[key];
            }
        }
        return target;
    }

    function simulateEvent(document, el, type, options) {
        var evt = createEvent(document, type, options);
        dispatchEvent(el, type, evt);
        return evt;
    }

    function createEvent(document, type, options) {
        if (/^mouse(over|out|down|up|move)|(dbl)?click$/.test(type)) {
            return mouseEvent(document, type, options);
        } else if (/^key(up|down|press)$/.test(type)) {
            return keyboardEvent(document, type, options);
        } else {
            return otherEvent(document, type, options);
        }
    }

    function mouseEvent(document, type, options) {
        var evt;
        var e = extend({
            bubbles:true, cancelable:(type != "mousemove"), detail:0,
            screenX:0, screenY:0, clientX:0, clientY:0,
            ctrlKey:false, altKey:false, shiftKey:false, metaKey:false,
            button:0, relatedTarget:undefined
        }, options);

        var relatedTarget = e.relatedTarget;

        if (typeof document.createEvent == 'function') {
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(type, e.bubbles, e.cancelable, e.view, e.detail,
                e.screenX, e.screenY, e.clientX, e.clientY,
                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                e.button, e.relatedTarget || document.body.parentNode);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
            evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
        }
        return evt;
    }

    function keyboardEvent(document, type, options) {
        var evt;

        var e = extend({ bubbles:true, cancelable:true,
            ctrlKey:false, altKey:false, shiftKey:false, metaKey:false,
            keyCode:0, charCode:0
        }, options);

        if (typeof document.createEvent == 'function') {
            try {
                evt = document.createEvent("KeyEvents");
                evt.initKeyEvent(type, e.bubbles, e.cancelable, e.view,
                    e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                    e.keyCode, e.charCode);
            } catch (err) {
                evt = document.createEvent("Events");
                evt.initEvent(type, e.bubbles, e.cancelable);
                extend(evt, { view:e.view,
                    ctrlKey:e.ctrlKey, altKey:e.altKey, shiftKey:e.shiftKey, metaKey:e.metaKey,
                    keyCode:e.keyCode, charCode:e.charCode
                });
            }
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
        }
        return evt;
    }

    function otherEvent(document, type, options) {
        var evt;

        var e = extend({ bubbles:true, cancelable:true
        }, options);

        if (typeof document.createEvent == 'function') {
            evt = document.createEvent("Events");
            evt.initEvent(type, e.bubbles, e.cancelable);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
        }
        return evt;
    }

    function dispatchEvent(el, type, evt) {
        if (el.dispatchEvent) {
            el.dispatchEvent(evt);
        } else if (el.fireEvent) {
            el.fireEvent('on' + type, evt);
        }
        return evt;
    }

    extend(simulate, {
        defaults:{
            speed:'sync',
            view:window
        },
        VK_TAB:9,
        VK_ENTER:13,
        VK_ESC:27,
        VK_PGUP:33,
        VK_PGDN:34,
        VK_END:35,
        VK_HOME:36,
        VK_LEFT:37,
        VK_UP:38,
        VK_RIGHT:39,
        VK_DOWN:40
    });

    return {
        globals: {
            jasmineui: {
                simulate: simulate
            }
        }
    };

});
jasmineui.define('client/loadUi', ['persistentData', 'globals', 'client/testAdapter', 'urlLoader', 'scriptAccessor', 'instrumentor', 'config', 'client/asyncSensor'], function (persistentData, globals, testAdapter, urlLoader, scriptAccessor, instrumentor, config, asyncSensor) {
    var pd = persistentData();

    function getOwnerLoadUiServer() {
        var owner = globals.opener || globals.parent;
        return owner && owner.jasmineui.loadUiServer;
    }

    var ownerLoadUiServer = getOwnerLoadUiServer();

    var analyzePhase = pd.specIndex === -1;
    if (analyzePhase) {
        runAnalyzePhase();
    } else {
        runExecutePhase();
    }

    function runAnalyzePhase() {
        addUtilScripts();
        var i;
        for (i = 0; i < pd.analyzeScripts.length; i++) {
            instrumentor.beginScript(pd.analyzeScripts[i]);
        }
        asyncSensor.afterAsync(function () {
            if (ownerLoadUiServer) {
                ownerLoadUiServer.createAndFilterSpecs();
                runNextSpec();
            } else {
                // In inplace mode, we need to call the spec runner again to
                // filter the collected specs.
                urlLoader.navigateWithReloadTo(globals, pd.reporterUrl);
            }
        });
    }

    function runExecutePhase() {
        var remoteSpec = pd.specs[pd.specIndex];
        var runner = testAdapter.initSpecRun(remoteSpec);
        logSpecStatus(remoteSpec);
        addUtilScripts();
        instrumentor.beginScript(remoteSpec.testScript);
        asyncSensor.afterAsync(function () {
            runner.execute(function () {
                if (ownerLoadUiServer) {
                    ownerLoadUiServer.specFinished(remoteSpec);
                }
                runNextSpec();
            });
        });
    }

    function runNextSpec() {
        pd.specIndex = pd.specIndex + 1;
        var url;
        if (pd.specIndex < pd.specs.length) {
            url = pd.specs[pd.specIndex].url;
        } else {
            if (ownerLoadUiServer) {
                ownerLoadUiServer.runFinished();
            } else {
                url = pd.reporterUrl;
            }
        }
        if (url) {
            urlLoader.navigateWithReloadTo(globals, url);
        }
    }


    function addUtilScripts() {
        var i, script;
        // first add the configured scripts
        for (i = 0; i < config.scripts.length; i++) {
            script = config.scripts[i];
            if (script.position === 'begin') {
                instrumentor.beginScript(script.url);
            } else {
                instrumentor.endScript(script.url);
            }
        }
    }

    function logSpecStatus(remoteSpec) {
        if (!globals.console) {
            return;
        }

        var output = '[';
        for (var i = 0; i < pd.specs.length; i++) {
            var spec = pd.specs[i];
            var state = ' ';
            if (spec.results) {
                state = spec.results.failedCount > 0 ? 'F' : '.';
            }
            output += state;
        }
        output += ']';
        globals.console.log("Jasmineui: " + output + ": " + remoteSpec.id);
    }

    function findRemoteSpecById(specId) {
        var i, spec;
        for (i = 0; i < pd.specs.length; i++) {
            spec = pd.specs[i];
            if (spec.id === specId) {
                return spec;
            }
        }
        return null;
    }

    var errorSpecCount = 0;

    function loadUi(url, callback) {
        var error;
        try {
            callback();
        } catch (e) {
            reportError(e);
            error = e;
        }
        if (!error && analyzePhase) {
            var scriptUrl = scriptAccessor.currentScriptUrl();
            var specIds = testAdapter.listSpecIds();
            var i, specId, remoteSpec;
            for (i = 0; i < specIds.length; i++) {
                specId = specIds[i];
                remoteSpec = findRemoteSpecById(specId);
                if (!remoteSpec) {
                    pd.specs.push({
                        testScript:scriptUrl,
                        url:url,
                        id:specId,
                        results:[]
                    });
                }
            }
        }
    }

    globals.addEventListener('error', function (event) {
        addErrorResult({
            message:event.message
        });
    }, false);

    function addErrorResult(errorResult) {
        var remoteSpec = pd.specs[pd.specIndex];
        if (remoteSpec) {
            remoteSpec.results.push(errorResult);
        } else {
            pd.globalErrors.push(errorResult);
        }

    }

    function reportError(e) {
        addErrorResult({
            message:e.toString(),
            stack:e.stack
        });
    }

    return {
        globals: {
            jasmineui: {
                loadUi: loadUi
            }
        },
        reportError:reportError
    }
});

jasmineui.define('client/beforeLoad', ['persistentData', 'globals', 'instrumentor', 'client/loadUi'], function (persistentData, globals, instrumentor, loadUi) {
    var pd = persistentData();

    if (pd.specIndex === -1) {
        globals.jasmineui.beforeLoad = function () {
            // Noop in analyze phase
        };
        return;
    }

    var remoteSpec = pd.specs[pd.specIndex];
    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        beforeLoadCallbacks.push(callback);
    }

    instrumentor.endCall(function () {
        var i;
        for (i = 0; i < beforeLoadCallbacks.length; i++) {
            try {
                beforeLoadCallbacks[i]();
            } catch (e) {
                loadUi.reportError(e);
            }
        }
    });

    return {
        globals: {
            jasmineui: {
                beforeLoad: beforeLoad
            }
        }
    }
});

jasmineui.define('server/loadUi', ['config', 'persistentData', 'scriptAccessor', 'globals', 'server/testAdapter', 'urlLoader'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader) {

    var firstLoadUiUrl;
    var testScripts = [];

    var GLOBAL_ERROR_SPEC_ID = "global#errors";

    var globalServerErrors = [];

    globals.addEventListener("error", function (event) {
        globalServerErrors.push({
            message:event.message
        });
    }, false);

    start();

    function loadUi(url) {
        testUrl(url);
        testScripts.push(scriptAccessor.currentScriptUrl());
        if (!firstLoadUiUrl) {
            firstLoadUiUrl = url;
        }
    }

    function testUrl(url) {
        var xhr = new globals.XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();
        if (xhr.status != 200) {
            throw new Error("Could not find url " + url);
        }
    }

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
            runner.createSpecs([errorSpec]);
            testAdapter.reportSpecResults(errorSpec);
            pd.specs = [];
        } else {
            pd.specs = runner.createSpecs(pd.specs);
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
            var win = openTestWindow(firstUrl);
            persistentData.saveDataToWindow(win);

            globals.jasmineui.loadUiServer = {
                createAndFilterSpecs:function () {
                    createAndFilterSpecs(runner);
                },
                specFinished:function (spec) {
                    testAdapter.reportSpecResults(spec);
                },
                runFinished:function () {
                    closeTestWindow();
                }
            };
        });
    }

    var remoteWindow;
    var frameElement;

    function openTestWindow(url) {
        if (remoteWindow) {
            remoteWindow.location.href = url;
            return remoteWindow;
        }
        var windowId = 'jasmineui-testwindow';
        if (config.loadMode === 'popup') {
            remoteWindow = globals.open(url, windowId);
        } else if (config.loadMode === 'iframe') {
            frameElement = globals.document.createElement("iframe");
            frameElement.name = windowId;
            frameElement.setAttribute("src", url);
            frameElement.setAttribute("style", "position: absolute; bottom: 0px; z-index:100; width: " + window.innerWidth + "px; height: " + window.innerHeight + "px");
            globals.document.body.appendChild(frameElement);
            remoteWindow = globals.frames[windowId];
        } else {
            throw new Error("Unknown load mode " + config.loadMode);
        }
        return remoteWindow;
    }

    function closeTestWindow() {
        if (remoteWindow && config.closeTestWindow) {
            if (config.loadMode === 'popup') {
                remoteWindow.close();
            } else if (config.loadMode === 'iframe') {
                frameElement.parentElement.removeChild(frameElement);
            }
        }
        remoteWindow = null;
    }

    function prepareExecution(runner) {
        var pd = persistentData();

        pd.analyzeScripts = testScripts;
        pd.specs = [];
        pd.specIndex = -1;
        pd.globalErrors = globalServerErrors;
        if (!firstLoadUiUrl) {
            createAndFilterSpecs(runner);
            return null;
        }
        if (globalServerErrors.length > 0) {
            // abort the test execution!
            createAndFilterSpecs(runner);
            return null;
        }
        return firstLoadUiUrl;
    }

    return {
        globals:{
            jasmineui:{
                loadUi:loadUi
            }
        }
    }
});

/* Jasmine adapter */
jasmineui.define('jasmine/original', ['globals'], function (globals) {

    /**
     * Save the original values, as we are overwriting them in some modules
     */
    return {
        it:globals.it,
        describe:globals.describe,
        beforeEach:globals.beforeEach,
        afterEach:globals.afterEach,
        runs:globals.runs,
        waitsFor:globals.waitsFor,
        waits:globals.waits,
        jasmine:globals.jasmine,
        expect:globals.expect
    }
});
jasmineui.define('client/jasmine/multiLoad', ['jasmine/original', 'persistentData', 'jasmine/client/waitsForAsync', 'globals'], function (jasmineOriginal, persistentData, waitsForAsync, globals) {
    var pd = persistentData();

    if (pd.specIndex === -1) {
        return;
    }

    var remoteSpec = pd.specs[pd.specIndex];
    remoteSpec.lastRunsIndex = remoteSpec.lastRunsIndex || 0;

    var skipRunsCounter = remoteSpec.lastRunsIndex;
    var reloadHappened = false;

    globals.window.addEventListener('beforeunload', function () {
        // Note: on iOS beforeunload is NOT supported.
        // In that case we rely on the fact, that timeouts no more executed
        // when a navigation change occurs. And we do wait some milliseconds between
        // every two runs statements using waitsForAsync.
        // On all other browsers, we use this flag to stop test execution.
        reloadHappened = true;
    });

    function runs(callback) {
        if (skipRunsCounter === 0) {
            waitsForAsync.runs(function () {
                if (reloadHappened) {
                    createInfiniteWaitsBlock(jasmineOriginal.jasmine.getEnv().currentSpec);
                } else {
                    callback();
                    // save the current state of the specs. Needed for specs that contain multiple reloads.
                    // As beforeunload does not work in iOS :-(
                    remoteSpec.lastRunsIndex++;
                    persistentData.saveDataToWindow(globals.window);
                }
            });
        } else {
            skipRunsCounter--;
        }
    }

    function waitsFor(callback) {
        if (skipRunsCounter === 0) {
            jasmineOriginal.waitsFor.apply(this, arguments);
        }
    }

    function waits(callback) {
        if (skipRunsCounter === 0) {
            jasmineOriginal.waits.apply(this, arguments);
        }
    }

    jasmineOriginal.afterEach(function () {
        waitsForAsync.runs(function () {
            if (reloadHappened) {
                createInfiniteWaitsBlock(jasmineOriginal.jasmine.getEnv().currentSpec);
            }
        });
    });

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

    return {
        globals: {
            waits:waits,
            waitsFor:waitsFor,
            runs:runs
        }
    }
});

jasmineui.define('jasmine/client/waitsForAsync', ['config', 'client/asyncSensor', 'jasmine/original'], function (config, asyncSensor, jasmineOriginal) {
    /**
     * Waits for the end of all asynchronous actions.
     */
    function waitsForAsync() {
        var asyncProcessing = true;
        jasmineOriginal.runs(function () {
            asyncSensor.afterAsync(function() {
                asyncProcessing = false;
            });
        });
        jasmineOriginal.waitsFor(function() {
            return !asyncProcessing;
        });
    }

    function runs(callback) {
        waitsForAsync();
        jasmineOriginal.runs(callback);
    }

    return {
        waitsForAsync: waitsForAsync,
        runs: runs
    };
});
jasmineui.define('client/testAdapter', ['jasmine/original', 'globals'], function (jasmineOriginal, globals) {
    var describeImpl = jasmineOriginal.describe;
    function describe() {
        return describeImpl.apply(this, arguments);
    }

    function initSpecRun(spec) {
        var specId = spec.id;
        var results = spec.results;

        function ignoreDescribesThatDoNotMatchTheSpecId() {
            var currentSuiteId = '';
            describeImpl = function (name) {
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
        globals: {
            describe: describe
        },
        listSpecIds:listSpecIds,
        initSpecRun:initSpecRun
    };
});



jasmineui.define('server/testAdapter', ['jasmine/original', 'globals'], function (jasmineOriginal) {
    var jasmine = jasmineOriginal.jasmine;

    var _execute = jasmineOriginal.jasmine.Runner.prototype.execute;

    function interceptSpecRunner(runCallback) {
        jasmineOriginal.jasmine.Runner.prototype.execute = function () {
            var self = this;

            function createSpecs(remoteSpecs) {
                var i, remoteSpec;
                var filteredIds = [];
                for (i = 0; i < remoteSpecs.length; i++) {
                    remoteSpec = remoteSpecs[i];
                    var localSpec = getOrCreateLocalSpec(remoteSpec.id);
                    if (localSpec.skipped) {
                        remoteSpecs.splice(i,1);
                        i--;
                    }
                }
                _execute.call(self);
                return remoteSpecs;
            }

            runCallback({
                createSpecs:createSpecs
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

    function splitSpecId(specId) {
        return specId.split("#");
    }

    return {
        interceptSpecRunner:interceptSpecRunner,
        reportSpecResults:reportSpecResults
    }

});

/* Main */
(function () {
    jasmineui.require.default();
})();


