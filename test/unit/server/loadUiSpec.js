jasmineui.require(["factory!server/loadUi"], function (loadUiFactory) {
    describe("server/loadUi", function () {
        var config, persistentData, persistentDataAccessor, scriptAccessor, globals, serverTestAdapter, loadUi, urlLoader, xhr;
        var saveDataToWindow, runnerCallback, createSpecs, reportSpecResults, openedWindow, openedFrame;
        beforeEach(function () {
            config = {};
            persistentData = {};
            saveDataToWindow = jasmine.createSpy('saveDataToWindow');
            persistentDataAccessor = function () {
                return persistentData;
            };
            persistentDataAccessor.saveDataToWindow = saveDataToWindow;
            scriptAccessor = {
                currentScriptUrl:jasmine.createSpy('currentScriptUrl')
            };
            xhr = {
                status:200,
                open:jasmine.createSpy('open'),
                send:jasmine.createSpy('send')
            };
            openedWindow = {
                close: jasmine.createSpy('close'),
                location: {}
            };
            openedFrame = {
                element: {
                    setAttribute: jasmine.createSpy('setAttribute'),
                    parentElement: {
                        removeChild: jasmine.createSpy('removeChild')
                    }
                },
                object: {
                    location: {}
                }
            };
            globals = {
                addEventListener:jasmine.createSpy('addEventListener'),
                jasmineui:{},
                XMLHttpRequest:function () {
                    return xhr;
                },
                location:{
                    href:'someOriginalRunner.html'
                },
                open: jasmine.createSpy('open').andReturn(openedWindow),
                frames: {
                    'jasmineui-testwindow': openedFrame.object
                },
                document: {
                    createElement: jasmine.createSpy('createElement').andReturn(openedFrame.element),
                    body: {
                        appendChild: jasmine.createSpy('appendChild')
                    }
                }
            };
            urlLoader = {
                navigateWithReloadTo:jasmine.createSpy('navigateWithReloadTo')
            };
            createSpecs = jasmine.createSpy('createSpecs').andCallFake(function (specIds) {
                return specIds;
            });
            reportSpecResults = jasmine.createSpy('reportSpecResults');
            runnerCallback = function () {
                return serverTestAdapter.interceptSpecRunner.mostRecentCall.args[0]({
                    createSpecs:createSpecs
                });
            };
            serverTestAdapter = {
                interceptSpecRunner:jasmine.createSpy('replaceSpecRunner'),
                reportSpecResults:reportSpecResults
            };
        });

        function createLoadUi() {
            loadUi = loadUiFactory({
                config:config,
                persistentData:persistentDataAccessor,
                scriptAccessor:scriptAccessor,
                globals:globals,
                'server/testAdapter':serverTestAdapter,
                urlLoader:urlLoader
            });
        }

        describe('inplace mode', function () {
            beforeEach(function () {
                config.loadMode = "inplace";
            });
            describe('start phase', function () {
                beforeEach(function () {
                    createLoadUi();
                });
                it('should not open any url but call createSpecs with empty list if no specs are defined', function () {
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    expect(createSpecs).toHaveBeenCalledWith([]);
                });
                it('should load the first page defined by loadUi', function () {
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, somePage);
                });
                it('should initialize the persistentData', function () {
                    var someSpec = 'someSpec.js';
                    scriptAccessor.currentScriptUrl.andReturn(someSpec);
                    globals.jasmineui.loadUi('somePage.html');
                    runnerCallback();
                    expect(persistentData).toEqual({
                        reporterUrl:globals.location.href,
                        specs:[],
                        specIndex:-1,
                        globalErrors:[],
                        analyzeScripts:[someSpec]
                    });
                });
                it('should throw an error if the url cannot be loaded by xhr', function () {
                    xhr.status = 500;
                    try {
                        globals.jasmineui.loadUi('someUrl.html');
                        throw new Error("expected an error");
                    } catch (e) {
                        // expected
                    }
                    expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl.html', false);
                });
                it('should not start if uncatched errors exist but report an error spec', function () {
                    var errorListener = globals.addEventListener.mostRecentCall.args[1];
                    var someError = 'someError';
                    errorListener({message:someError});
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:someError }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });


            });

            describe('filter phase', function () {
                beforeEach(function () {
                    persistentData = {
                        reporterUrl:globals.location.href,
                        specs:[
                            {id:'spec1', url:'page1.html'},
                            {id:'spec2', url:'page2.html'}
                        ],
                        specIndex:-1,
                        globalErrors:[],
                        analyzeScripts:['someSpec.js']
                    };
                    createLoadUi();
                });
                it('should filter the specs using the testAdapter', function () {
                    createSpecs.andCallFake(function (specs) {
                        return [specs[1]];
                    });
                    runnerCallback();
                    expect(persistentData.specs).toEqual([
                        {id:'spec2', url:'page2.html'}
                    ]);
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, 'page2.html');
                });
                it('should not report results', function () {
                    runnerCallback();
                    expect(reportSpecResults).not.toHaveBeenCalled();
                });
                it('should do nothing if all specs are filtered', function () {
                    createSpecs.andCallFake(function (specs) {
                        return [];
                    });
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                });
                it('should report errors from the analyzing phase in the client', function () {
                    var someError = 'someError';
                    persistentData.globalErrors = [
                        {
                            message:someError
                        }
                    ];
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:someError }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });
            });
            describe('results phase', function () {
                beforeEach(function () {
                    persistentData = {
                        reporterUrl:globals.location.href,
                        specs:[
                            {id:'spec1', url:'page1.html', results:[]}
                        ],
                        specIndex:1,
                        globalErrors:[],
                        analyzeScripts:['someSpec.js']
                    };
                    createLoadUi();

                });
                it('should create and report the results to the testAdapter', function () {
                    runnerCallback();
                    expect(createSpecs).toHaveBeenCalledWith(persistentData.specs);
                    expect(reportSpecResults).toHaveBeenCalledWith(persistentData.specs[0]);
                });
            });
        });
        describe('popup mode', function () {
            beforeEach(function () {
                config.loadMode = "popup";
            });
            describe('start phase', function () {
                beforeEach(function () {
                    createLoadUi();
                });
                it('should not open any url but call createSpecs with empty list if no specs are defined', function () {
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    expect(saveDataToWindow).not.toHaveBeenCalled();
                    expect(createSpecs).toHaveBeenCalledWith([]);
                });
                it('should load the first page defined by loadUi using window.open', function () {
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(globals.open).toHaveBeenCalled();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    expect(saveDataToWindow).toHaveBeenCalledWith(openedWindow);
                });
                it('should reuse an existing open window', function() {
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    globals.open.reset();
                    openedWindow.location.href = '';
                    runnerCallback();
                    expect(globals.open).not.toHaveBeenCalled();
                    expect(openedWindow.location.href).toBe(somePage);
                });
                it('should initialize the persistentData', function () {
                    var someSpec = 'someSpec.js';
                    scriptAccessor.currentScriptUrl.andReturn(someSpec);
                    globals.jasmineui.loadUi('somePage.html');
                    runnerCallback();
                    expect(persistentData).toEqual({
                        specs:[],
                        specIndex:-1,
                        globalErrors:[],
                        analyzeScripts:[someSpec]
                    });
                });
                it('should throw an error if the url cannot be loaded by xhr', function () {
                    xhr.status = 500;
                    try {
                        globals.jasmineui.loadUi('someUrl.html');
                        throw new Error("expected an error");
                    } catch (e) {
                        // expected
                    }
                    expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl.html', false);
                });
                it('should not start if uncatched errors exist but report an error spec', function () {
                    var errorListener = globals.addEventListener.mostRecentCall.args[1];
                    var someError = 'someError';
                    errorListener({message:someError});
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(saveDataToWindow).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:someError }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });
                describe('filter phase', function () {
                    beforeEach(function () {
                        createLoadUi();
                        globals.jasmineui.loadUi("somePage.html");
                        runnerCallback();
                        persistentData.specs = [
                                {id:'spec1', url:'page1.html'},
                                {id:'spec2', url:'page2.html'}
                            ];
                    });
                    it('should filter the specs using the testAdapter', function () {
                        var spec1 = persistentData.specs[0];
                        var spec2 = persistentData.specs[1];
                        createSpecs.andCallFake(function (specs) {
                            return [specs[1]];
                        });
                        globals.jasmineui.loadUiServer.createAndFilterSpecs();
                        expect(persistentData.specs).toEqual([spec2]);
                        expect(createSpecs).toHaveBeenCalledWith([spec1, spec2]);
                    });
                    it('should not report results', function () {
                        globals.jasmineui.loadUiServer.createAndFilterSpecs();
                        expect(reportSpecResults).not.toHaveBeenCalled();
                    });
                    it('should report errors from the analyzing phase in the client', function () {
                        var someError = 'someError';
                        persistentData.globalErrors = [
                            {
                                message:someError
                            }
                        ];
                        globals.jasmineui.loadUiServer.createAndFilterSpecs();
                        var errorSpec = {
                            id:'global#errors',
                            results:[
                                { message:someError }
                            ]
                        };
                        expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                        expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                        expect(persistentData.specs).toEqual([]);
                    });
                });
                describe('results phase', function() {
                    beforeEach(function () {
                        createLoadUi();
                        globals.jasmineui.loadUi("somePage.html");
                        runnerCallback();
                        persistentData.specs = [
                            {id:'spec1', url:'page1.html', results:[]}
                        ];
                    });
                    it('should report the results to the testAdapter', function () {
                        globals.jasmineui.loadUiServer.specFinished(persistentData.specs[0]);
                        expect(reportSpecResults).toHaveBeenCalledWith(persistentData.specs[0]);
                    });
                    it('should close the window if specs are finished and config.closeTestWindow=true', function () {
                        config.closeTestWindow = true;
                        globals.jasmineui.loadUiServer.runFinished();
                        expect(openedWindow.close).toHaveBeenCalled();
                    });
                    it('should not close the window if specs are finished and config.closeTestWindow=false', function () {
                        config.closeTestWindow = false;
                        globals.jasmineui.loadUiServer.runFinished();
                        expect(openedWindow.close).not.toHaveBeenCalled();
                    });
                });
            });

        });

        describe('iframe mode', function () {
            var somePage = 'somePage.html';
            beforeEach(function () {
                config.loadMode = "iframe";
                createLoadUi();
                globals.jasmineui.loadUi(somePage);
                runnerCallback();
            });
            it('should load the first page defined by loadUi using an iframe', function () {
                expect(globals.document.createElement).toHaveBeenCalledWith('iframe');
                expect(openedFrame.element.name).toBe('jasmineui-testwindow');
                expect(openedFrame.element.setAttribute).toHaveBeenCalledWith('src', somePage);
                expect(globals.document.body.appendChild).toHaveBeenCalledWith(openedFrame.element);
                expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                expect(saveDataToWindow).toHaveBeenCalledWith(openedFrame.object);
            });
            it('should reuse an existing open iframe', function() {
                globals.document.createElement.reset();
                openedFrame.object.location.ref = '';
                runnerCallback();
                expect(globals.document.createElement).not.toHaveBeenCalled();
                expect(globals.open).not.toHaveBeenCalled();
                expect(openedFrame.object.location.href).toBe(somePage);
            });
            it('should remove the iframe if specs are finished and config.closeTestWindow=true', function () {
                config.closeTestWindow = true;
                globals.jasmineui.loadUiServer.runFinished();
                expect(openedFrame.element.parentElement.removeChild).toHaveBeenCalled();
            });
            it('should not remove the iframe if specs are finished and config.closeTestWindow=false', function () {
                config.closeTestWindow = false;
                globals.jasmineui.loadUiServer.runFinished();
                expect(openedFrame.element.parentElement.removeChild).not.toHaveBeenCalled();
            });
        });
    });
});
