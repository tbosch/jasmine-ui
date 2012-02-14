jasmineui.define('server/remoteSpecServer', ['server/jasmineApi', 'server/describeUi', 'server/testwindow', 'remote!client/remoteSpecClient', 'remote!client/asyncSensor'], function (jasmineApi, originalDescribeUi, testwindow, clientRemote, asyncSensorRemote) {
    var currentNode;

    function Node(executeCallback) {
        this.executeCallback = executeCallback;
        this.children = {};
        this.childCount = 0;
        this.parent = null;
    }

    Node.prototype = {
        execute:function () {
            this.executed = true;
            var oldNode = currentNode;
            currentNode = this;
            try {
                return this.executeCallback();
            } finally {
                currentNode = oldNode;
            }
        },
        bindExecute:function () {
            var self = this;
            return function () {
                return self.execute();
            }
        },
        addChild:function (type, name, childNode) {
            if (!name) {
                name = '' + this.childCount;
            }
            this.childCount++;
            childNode.name = name;
            childNode.type = type;
            childNode.parent = this;
            this.children[name] = childNode;
        },
        child:function (childId) {
            return this.children[childId];
        },
        path:function () {
            if (this.parent == null) {
                // Ignore Root-Node in the path
                return [];
            } else {
                var res = this.parent.path();
                res.push(this.name);
                return res;
            }
        },
        inDescribeUi:function () {
            if (this.describeUi) {
                return true;
            }
            if (this.parent) {
                return this.parent.inDescribeUi();
            }
            return false;
        },
        toString:function () {
            if (this.parent == null) {
                return [];
            } else {
                var res = this.parent.toString();
                res.push(this.type + ':' + this.name);
                return res;
            }
        }
    };

    var rootNode = new Node(function () {
    });
    currentNode = rootNode;

    function addServerExecutingNode(type, name, callback) {
        var node = new Node(callback);
        currentNode.addChild(type, name, node);
        return node;
    }

    function describe(name, callback) {
        var node = addServerExecutingNode('describe', name, callback);
        jasmineApi.describe(name, node.bindExecute());
    }

    function describeUi(name, pageUrl, callback) {
        var node = addServerExecutingNode('describe', name, callback);
        node.describeUi = true;
        originalDescribeUi.describeUi(name, pageUrl, node.bindExecute());
    }

    function addClientExecutingNode(type, name) {
        var node = new Node(function () {
            return clientRemote(testwindow()).executeSpecNode(node.path());
        });
        currentNode.addChild(type, name, node);
        return node;
    }

    function it(name, callback) {
        if (currentNode.inDescribeUi()) {
            callback = addClientExecutingNode('it', name).bindExecute();
        }
        jasmineApi.it(name, callback);
    }

    function beforeEach(callback) {
        if (currentNode.inDescribeUi()) {
            callback = addClientExecutingNode('beforeEach').bindExecute();
        }
        jasmineApi.beforeEach(callback);
    }

    function afterEach(callback) {
        if (currentNode.inDescribeUi()) {
            callback = addClientExecutingNode('afterEach').bindExecute();
        }
        jasmineApi.afterEach(callback);
    }

    function beforeLoad(callback) {
        originalDescribeUi.beforeLoad(addClientExecutingNode('beforeLoad', undefined).bindExecute());
    }


    /**
     * For runs, waitsFor and waits we create the nodes triggered by the testwindow.
     * This is needed as we do not want to execute it, beforeEach and afterEach
     * on the server (which can contain the runs, ... statements).
     * <p>
     * This will be called from the testwindow!
     */
    function addClientDefinedNode(type, name, extraArgs) {
        var node = currentNode.child(name);
        if (!node) {
            node = addClientExecutingNode(type, name);
        }
        extraArgs = extraArgs || [];
        if (type === 'runs') {
            jasmineApi.runs(node.bindExecute());
        } else if (type === 'waitsFor') {
            var callback = function () {
                var testwin = testwindow();
                if (testwin.document.readyState!=="complete") {
                    return false;
                }
                if (asyncSensorRemote(testwin)()) {
                    return false;
                }
                return node.execute();
            };
            extraArgs.unshift(callback);
            jasmineApi.waitsFor.apply(this, extraArgs);
        } else if (type === 'waits') {
            jasmineApi.waits.apply(this, extraArgs);
        }
    }

    return {
        it:it,
        beforeEach:beforeEach,
        afterEach:afterEach,
        beforeLoad:beforeLoad,
        describe:describe,
        describeUi:describeUi,
        addClientDefinedSpecNode:addClientDefinedNode
    }
});