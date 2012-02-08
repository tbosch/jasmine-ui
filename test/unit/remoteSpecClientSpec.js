describe('remoteSpecClient', function () {
    var mod;
    var d, dui, i, r, be, ae, bl, wf, w, wfa;
    var serverInvoker;
    var noop = function () {
    };
    var callback;
    beforeEach(function () {
        callback = jasmine.createSpy('callback');
        serverInvoker = {
            addClientDefinedSpecNode:jasmine.createSpy('addClientDefinedSpecNode')
        };
        mod = require.factory('client/remoteSpecClient', {
            'client/serverInvoker':serverInvoker
        });
        dui = mod.describeUi;
        d = mod.describe;
        i = mod.it;
        r = mod.runs;
        be = mod.beforeEach;
        ae = mod.afterEach;
        bl = mod.beforeLoad;
        wf = mod.waitsFor;
        w = mod.waits;
        wfa = mod.waitsForAsync;
    });

    describe('executeSpecNode', function () {
        it("should execute it callbacks", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', callback);
            });
            mod.executeSpecNode(['describe1', 'it1']);
            expect(callback).toHaveBeenCalled();
        });

        it("should execute beforeEach callbacks", function () {
            dui('describe1', 'someUrl', function () {
                be(callback);
            });
            mod.executeSpecNode(['describe1', '0']);
            expect(callback).toHaveBeenCalled();
        });

        it("should execute afterEach callbacks", function () {
            dui('describe1', 'someUrl', function () {
                ae(callback);
            });
            mod.executeSpecNode(['describe1', '0']);
            expect(callback).toHaveBeenCalled();
        });

        it("should execute beforeLoad callbacks", function () {
            dui('describe1', 'someUrl', function () {
                bl(callback);
            });
            mod.executeSpecNode(['describe1', '0']);
            expect(callback).toHaveBeenCalled();
        });

        it("should execute runs callbacks", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    r(callback);
                });
            });
            mod.executeSpecNode(['describe1', 'it1', '0']);
            expect(callback).toHaveBeenCalled();
        });

        it("should execute waitsFor callbacks and return their result", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    wf(callback);
                });
            });
            var someValue = 'someValue';
            callback.andReturn(someValue);
            expect(mod.executeSpecNode(['describe1', 'it1', '0'])).toBe(someValue);
            expect(callback).toHaveBeenCalled();
        });

        it("should expand parent describes and describeUis", function () {
            var flag1 = 0, flag2 = 0;
            d('describe1', function () {
                flag1++;
                dui('describe2', 'someUrl', function () {
                    flag2++;
                    i('it1', noop);
                });
            });
            mod.executeSpecNode(['describe1', 'describe2', 'it1']);
            expect(flag1).toBe(1);
            expect(flag2).toBe(1);
        });

        it("should not expand sibling nodes", function () {
            var flag1 = 0, flag2 = 0;
            d('describe', function () {
                d('describe1', function () {
                    flag1++;
                });
                d('describe2', function () {
                    flag2++;
                    i('it1', noop);
                });
            });
            mod.executeSpecNode(['describe', 'describe2', 'it1']);
            expect(flag1).toBe(0);
            expect(flag2).toBe(1);
        });

        it("should throw an error for non existing nodes", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', callback);
            });
            try {
                mod.executeSpecNode(['describe1', 'nonExistingIt']);
                expect(true).toBe(false);
            } catch (e) {
                // expected
            }
        });
    });

    describe('runs', function () {
        it("should add client defined nodes to the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    r(noop);
                });
            });
            mod.executeSpecNode(['describe1', 'it1']);
            expect(serverInvoker.addClientDefinedSpecNode).toHaveBeenCalledWith('runs', '0', undefined);
        });
        it("should not add client defined nodes to the server when not below the called node from the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    r(noop);
                });
            });
            mod.executeSpecNode(['describe1', 'it1', '0']);
            expect(serverInvoker.addClientDefinedSpecNode).not.toHaveBeenCalled();
        });
    });

    describe('waitsFor', function () {
        it("should add client defined nodes to the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    wf(noop, 1234);
                });
            });
            mod.executeSpecNode(['describe1', 'it1']);
            expect(serverInvoker.addClientDefinedSpecNode).toHaveBeenCalledWith('waitsFor', '0', [1234]);
        });
        it("should not add client defined nodes to the server when not below the called node from the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    wf(noop);
                });
            });
            mod.executeSpecNode(['describe1', 'it1', '0']);
            expect(serverInvoker.addClientDefinedSpecNode).not.toHaveBeenCalled();
        });

    });

    describe('waits', function () {
        it("should add client defined nodes to the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    w(1234);
                });
            });
            mod.executeSpecNode(['describe1', 'it1']);
            expect(serverInvoker.addClientDefinedSpecNode).toHaveBeenCalledWith('waits', '0', [1234]);
        });
        it("should not add client defined nodes to the server when not below the called node from the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    w();
                });
            });
            mod.executeSpecNode(['describe1', 'it1', '0']);
            expect(serverInvoker.addClientDefinedSpecNode).not.toHaveBeenCalled();
        });

    });

    describe('waitsForAsync', function () {
        it("should add client defined nodes to the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    wfa(1234);
                });
            });
            mod.executeSpecNode(['describe1', 'it1']);
            expect(serverInvoker.addClientDefinedSpecNode).toHaveBeenCalledWith('waitsForAsync', '0', [1234]);
        });
        it("should not add client defined nodes to the server when not below the called node from the server", function () {
            dui('describe1', 'someUrl', function () {
                i('it1', function () {
                    wfa(noop);
                });
            });
            mod.executeSpecNode(['describe1', 'it1', '0']);
            expect(serverInvoker.addClientDefinedSpecNode).not.toHaveBeenCalled();
        });

    });
});