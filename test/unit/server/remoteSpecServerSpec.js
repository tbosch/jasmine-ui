jasmineui.require(['factory!server/remoteSpecServer'], function (remoteSpecServerFactory) {
    describe('server/remoteSpecServer', function () {
        var mod, jasmineApi, clientMod, describeUi, asyncSensorRemote, waitsForAsync;
        var d, i, dui, be, ae, bl, callback, noop;
        beforeEach(function () {
            noop = function () {
            };
            callback = jasmine.createSpy('callback');
            describeUi = {
                describeUi:jasmine.createSpy('describeUi'),
                beforeLoad:jasmine.createSpy('beforeLoad')
            };
            jasmineApi = {
                describe:jasmine.createSpy('describe'),
                it:jasmine.createSpy('it'),
                beforeEach:jasmine.createSpy('beforeEach'),
                afterEach:jasmine.createSpy('afterEach'),
                runs:jasmine.createSpy('runs'),
                waitsFor:jasmine.createSpy('waitsFor'),
                waits:jasmine.createSpy('waits')
            };
            clientMod = {
                executeSpecNode:jasmine.createSpy('executeSpecNode')
            };
            asyncSensorRemote = jasmine.createSpy('asyncSensorRemote').andReturn(jasmine.createSpy('asyncSensor'));
            waitsForAsync = jasmine.createSpy('waitsForAsync');
            mod = remoteSpecServerFactory({
                'server/jasmineApi':jasmineApi,
                'remote!client/remoteSpecClient':jasmine.createSpy().andReturn(clientMod),
                'server/describeUi':describeUi,
                'remote!client/asyncSensor':asyncSensorRemote,
                'server/waitsForAsync': waitsForAsync
            });
            d = mod.describe;
            i = mod.it;
            dui = mod.describeUi;
            be = mod.beforeEach;
            ae = mod.afterEach;
            bl = mod.beforeLoad;
        });

        describe('describe', function () {
            it("should call original describe", function () {
                d('describe1', noop);
                expect(jasmineApi.describe.argsForCall[0][0]).toBe('describe1');
            });

            it("should execute the given callback", function () {
                d('describe1', callback);
                jasmineApi.describe.argsForCall[0][1]();
                expect(callback).toHaveBeenCalled();
            });
        });

        describe('describeUi', function () {
            it("should call original describeUi", function () {
                dui('describe1', 'someUrl', noop);
                expect(describeUi.describeUi.argsForCall[0][0]).toBe('describe1');
                expect(describeUi.describeUi.argsForCall[0][1]).toBe('someUrl');
            });

            it("should execute the given callback", function () {
                dui('describe1', 'someUrl', callback);
                describeUi.describeUi.argsForCall[0][2]();
                expect(callback).toHaveBeenCalled();
            });
        });

        describe('it', function () {
            describe('in normal describe', function () {
                it("should call original it", function () {
                    d('describe1', function () {
                        i('it1', noop);
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    expect(jasmineApi.it.argsForCall[0][0]).toBe('it1');
                });

                it("should execute the given callback", function () {
                    d('describe1', function () {
                        i('it1', callback);
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    jasmineApi.it.argsForCall[0][1]();
                    expect(callback).toHaveBeenCalled();
                });
            });

            describe('in describeUi', function () {
                it("should call original it", function () {
                    dui('describe1', 'someUrl', function () {
                        i('it1', noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    expect(jasmineApi.it.argsForCall[0][0]).toBe('it1');
                });

                it("should not execute the given callback", function () {
                    dui('describe1', 'someUrl', function () {
                        i('it1', callback);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.it.argsForCall[0][1]();
                    expect(callback).not.toHaveBeenCalled();
                });

                it("should call the client ", function () {
                    dui('describe1', 'someUrl', function () {
                        i('it1', noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.it.argsForCall[0][1]();
                    expect(clientMod.executeSpecNode).toHaveBeenCalledWith(['describe1', 'it1']);
                });

                it("should call the client when in nested describes", function () {
                    d('describe1', function () {
                        dui('describe2', 'someUrl', function () {
                            i('it1', noop);
                        });
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.it.argsForCall[0][1]();
                    expect(clientMod.executeSpecNode).toHaveBeenCalledWith(['describe1', 'describe2', 'it1']);
                });
            });
        });

        describe('beforeEach', function () {
            describe('in normal describe', function () {
                it("should call the original beforeEach", function () {
                    d('describe1', function () {
                        be(noop);
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    expect(jasmineApi.beforeEach).toHaveBeenCalled();
                });

                it("should execute the given callback", function () {
                    d('describe1', function () {
                        be(callback);
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(callback).toHaveBeenCalled();
                });
            });

            describe('in describeUi', function () {
                it("should call the original beforeEach", function () {
                    dui('describe1', 'someUrl', function () {
                        be(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    expect(jasmineApi.beforeEach).toHaveBeenCalled();
                });

                it("should not execute the given callback", function () {
                    dui('describe1', 'someUrl', function () {
                        be(callback);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(callback).not.toHaveBeenCalled();
                });

                it("should call the client", function () {
                    dui('describe1', 'someUrl', function () {
                        be(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(clientMod.executeSpecNode).toHaveBeenCalledWith(['describe1', '0']);
                });

                it("should call the client with incrementing ids when using multiple beforeEach", function () {
                    dui('describe1', 'someUrl', function () {
                        be(noop);
                        be(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    jasmineApi.beforeEach.argsForCall[1][0]();
                    expect(clientMod.executeSpecNode.argsForCall[0][0]).toEqual(['describe1', '0']);
                    expect(clientMod.executeSpecNode.argsForCall[1][0]).toEqual(['describe1', '1']);
                });
            });

        });

        describe('afterEach', function () {
            describe('in normal describe', function () {
                it("should call the original afterEach", function () {
                    d('describe1', function () {
                        ae(noop);
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    expect(jasmineApi.afterEach).toHaveBeenCalled();
                });

                it("should execute the given callback", function () {
                    d('describe1', function () {
                        ae(callback);
                    });
                    jasmineApi.describe.argsForCall[0][1]();
                    jasmineApi.afterEach.argsForCall[0][0]();
                    expect(callback).toHaveBeenCalled();
                });
            });

            describe('in describeUi', function () {
                it("should call the original afterEach", function () {
                    dui('describe1', 'someUrl', function () {
                        ae(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    expect(jasmineApi.afterEach).toHaveBeenCalled();
                });

                it("should not execute the given callback", function () {
                    dui('describe1', 'someUrl', function () {
                        ae(callback);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.afterEach.argsForCall[0][0]();
                    expect(callback).not.toHaveBeenCalled();
                });

                it("should call the client", function () {
                    dui('describe1', 'someUrl', function () {
                        ae(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.afterEach.argsForCall[0][0]();
                    expect(clientMod.executeSpecNode).toHaveBeenCalledWith(['describe1', '0']);
                });

                it("should call the client with incrementing ids when using multiple afterEach", function () {
                    dui('describe1', 'someUrl', function () {
                        ae(noop);
                        ae(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    jasmineApi.afterEach.argsForCall[0][0]();
                    jasmineApi.afterEach.argsForCall[1][0]();
                    expect(clientMod.executeSpecNode.argsForCall[0][0]).toEqual(['describe1', '0']);
                    expect(clientMod.executeSpecNode.argsForCall[1][0]).toEqual(['describe1', '1']);
                });
            });

        });

        describe('beforeLoad', function () {
            describe('in describeUi', function () {
                it("should call the original beforeLoad", function () {
                    dui('describe1', 'someUrl', function () {
                        bl(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    expect(describeUi.beforeLoad).toHaveBeenCalled();
                });

                it("should not execute the given callback", function () {
                    dui('describe1', 'someUrl', function () {
                        bl(callback);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    describeUi.beforeLoad.argsForCall[0][0]();
                    expect(callback).not.toHaveBeenCalled();
                });

                it("should call the client", function () {
                    dui('describe1', 'someUrl', function () {
                        bl(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    describeUi.beforeLoad.argsForCall[0][0]();
                    expect(clientMod.executeSpecNode).toHaveBeenCalledWith(['describe1', '0']);
                });

                it("should call the client with incrementing ids when using multiple beforeLoad", function () {
                    dui('describe1', 'someUrl', function () {
                        bl(noop);
                        bl(noop);
                    });
                    describeUi.describeUi.argsForCall[0][2]();
                    describeUi.beforeLoad.argsForCall[0][0]();
                    describeUi.beforeLoad.argsForCall[1][0]();
                    expect(clientMod.executeSpecNode.argsForCall[0][0]).toEqual(['describe1', '0']);
                    expect(clientMod.executeSpecNode.argsForCall[1][0]).toEqual(['describe1', '1']);
                });
            });

        });

        describe('addClientDefinedSpecNode', function () {
            beforeEach(function () {
                dui('describe1', 'someUrl', function () {
                    be(noop);
                });
                describeUi.describeUi.argsForCall[0][2]();
            });
            describe('runs', function () {
                it("should call the original runs", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('runs', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(jasmineApi.runs).toHaveBeenCalled();
                });
                it("should call waitsForAsync before", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('waitsFor', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(waitsForAsync).toHaveBeenCalled();
                });
                it("should call the client when the new node executes", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('runs', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    jasmineApi.runs.argsForCall[0][0]();
                    expect(clientMod.executeSpecNode.mostRecentCall.args[0]).toEqual(['describe1', '0', '0']);
                });
                it("should call the client when the new node is added multiple times", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('runs', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    jasmineApi.runs.argsForCall[1][0]();
                    expect(clientMod.executeSpecNode.mostRecentCall.args[0]).toEqual(['describe1', '0', '0']);
                });
            });
            describe('waitsFor', function () {
                it("should call the original waitsFor with the given timeout", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('waitsFor', '0', [1234]);
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(jasmineApi.waitsFor).toHaveBeenCalled();
                    expect(jasmineApi.waitsFor.argsForCall[0][1]).toBe(1234);
                });
                it("should call waitsForAsync before", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('waitsFor', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(waitsForAsync).toHaveBeenCalled();
                });
                it("should call the client when the new node executes and return the value of the client", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('waitsFor', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    var someValue = 'someValue';
                    clientMod.executeSpecNode.andReturn(someValue);
                    expect(jasmineApi.waitsFor.argsForCall[0][0]()).toBe(someValue);
                    expect(clientMod.executeSpecNode.mostRecentCall.args[0]).toEqual(['describe1', '0', '0']);
                });
                it("should call the client when the new node is added multiple times", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('waitsFor', '0');
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    jasmineApi.waitsFor.argsForCall[1][0]();
                    expect(clientMod.executeSpecNode.mostRecentCall.args[0]).toEqual(['describe1', '0', '0']);
                });
            });
            describe('waits', function () {
                it("should call the original waits with the given timeout", function () {
                    clientMod.executeSpecNode.andCallFake(function () {
                        mod.addClientDefinedSpecNode('waits', '0', [1234]);
                    });
                    jasmineApi.beforeEach.argsForCall[0][0]();
                    expect(jasmineApi.waits).toHaveBeenCalled();
                    expect(jasmineApi.waits.argsForCall[0][0]).toBe(1234);
                });
            });
        });


    });

});
