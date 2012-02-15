jasmineui.define('client/remoteSpecClient', ['remote!server/remoteSpecServer'], function (serverRemote) {
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
            if (!this.executed) {
                this.execute();
            }
            return this.children[childId];
        },
        findChild:function (childPath) {
            if (childPath.length === 0) {
                return this;
            }
            var childId = childPath.shift();
            var child = this.child(childId);
            if (!child) {
                throw new Error("Cannot find child " + childId + " in " + this.toString());
            }
            return child.findChild(childPath);
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
    var currentExecuteNode;

    function addNode(type, name, callback) {
        var node = new Node(callback);
        currentNode.addChild(type, name, node);
        return node;
    }

    var beforeLoad = function (callback) {
        addNode('beforeLoad', null, callback);
    };

    var describeUi = function (name, pageUrl, callback) {
        addNode('describe', name, callback);
    };

    var describe = function (name, callback) {
        addNode('describe', name, callback);
    };

    var it = function (name, callback) {
        addNode('it', name, callback);
    };

    var beforeEach = function (callback) {
        addNode('beforeEach', null, callback);
    };

    var afterEach = function (callback) {
        addNode('afterEach', null, callback);
    };

    function addLocallyDefinedNode(type, name, callback, extraArgs) {
        var node = addNode(type, name, callback);
        // Only add a node like runs, waitsFor, ... if the server called us
        // first for the parent node. This is important if
        // we have a page reload within an "it" statement:
        // The server then already knows about all required runs from the
        // first testwindow!
        if (currentNode == currentExecuteNode) {
            serverRemote().addClientDefinedSpecNode(type, node.name, extraArgs);
        }
    }

    var runs = function (callback) {
        addLocallyDefinedNode('runs', undefined, callback);
    };

    var waitsFor = function (callback) {
        addLocallyDefinedNode('waitsFor', undefined, callback, Array.prototype.slice.call(arguments, 1));
    };

    var waits = function () {
        addLocallyDefinedNode('waits', undefined, function () {
        }, Array.prototype.slice.call(arguments));
    };

    var executeSpecNode = function (nodePath) {
        var oldNode = currentExecuteNode;
        currentExecuteNode = rootNode.findChild(nodePath);
        try {
            return currentExecuteNode.execute();
        } finally {
            oldNode = currentExecuteNode;
        }
    };

    return {
        describe:describe,
        describeUi:describeUi,
        it:it,
        beforeEach:beforeEach,
        afterEach:afterEach,
        beforeLoad:beforeLoad,
        runs:runs,
        waitsFor:waitsFor,
        waits:waits,
        executeSpecNode:executeSpecNode
    }
});