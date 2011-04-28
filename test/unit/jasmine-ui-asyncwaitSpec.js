
describe(
		"jasmine.asyncwait",
		function() {
			var storedObjects = [];
			
			beforeEach(function() {
				storedMethods = [];
				storedMethods.push({
					'object' : window,
					'clearTimeout' : window.clearTimeout,
					'setTimeout' : window.setTimeout,
					'clearInterval' : window.clearInterval,
					'setInterval' : window.setInterval
				});
				storedMethods.push({
					'object' : jQuery,
					'ajax' : jQuery.ajax
				});
				storedMethods.push({
					'object' : jQuery.fn,
					'animationComplete' : jQuery.fn.animationComplete
				});
			});

			afterEach(function() {
				for ( var i = 0; i < storedMethods.length; i++) {
					var entry = storedMethods[i];
					var object = entry.object;
					for ( var fnname in entry) {
						var value = entry[fnname];
						if (fnname != 'object') {
							object[fnname] = value;
						}
					}
				}
			});

			it('should instrument timeout only beforeContent', function() {
                delete window.myframe;
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                expect(window.myframe).toBeTruthy();
                var mywindow = myframe.window;
				var finished = jasmine.asyncwait.instrumentTimeout(mywindow,
						'afterContent');
				expect(finished).toEqual(null);
				var finished = jasmine.asyncwait.instrumentTimeout(mywindow,
						'beforeContent');
				expect(finished).toBeTruthy();
			});

			it('should detect timeout waiting', function() {
                delete window.myframe;
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                expect(window.myframe).toBeTruthy();
                var mywindow = myframe.window;
				var finished = jasmine.asyncwait.instrumentTimeout(mywindow,
						'beforeContent');
				var called = false;
				runs(function() {
					expect(finished()).toEqual(true);
					mywindow.setTimeout(function() {
						called = true;
					}, 100);
					expect(finished()).toEqual(false);
				});
				waitsFor(function() {
					return called;
				}, 2000);
				runs(function() {
					expect(finished()).toEqual(true);
				});
			});

			it('should detect timeout clearance', function() {
                delete window.myframe;
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                expect(window.myframe).toBeTruthy();
                var mywindow = myframe.window;
				var finished = jasmine.asyncwait.instrumentTimeout(mywindow,
						"beforeContent");
				var called = false;
				expect(finished()).toEqual(true);
				var handle = mywindow.setTimeout(function() {
					called = true;
				}, 5000);
				expect(finished()).toEqual(false);
				mywindow.clearTimeout(handle);
				expect(finished()).toEqual(true);
			});

			it('should instrument interval only beforeContent', function() {
                delete window.myframe;
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                expect(window.myframe).toBeTruthy();
                var mywindow = myframe.window;
				var finished = jasmine.asyncwait.instrumentInterval(mywindow,
						"afterContent");
				expect(finished).toEqual(null);
				var finished = jasmine.asyncwait.instrumentInterval(mywindow,
						"beforeContent");
				expect(finished).toBeTruthy();
			});

			it('should detect interval waiting', function() {
                delete window.myframe;
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                expect(window.myframe).toBeTruthy();
                var mywindow = myframe.window;
				var finished = jasmine.asyncwait.instrumentInterval(mywindow,
						"beforeContent");
				expect(finished()).toEqual(true);
				var handle = mywindow.setInterval(function() {
					called = true;
				}, 100);
				expect(finished()).toEqual(false);
				mywindow.clearInterval(handle);
				expect(finished()).toEqual(true);
			});

			it('should allow intervals to work', function() {
                delete window.myframe;
                $("#myframe").remove();
                $("body").append('<iframe id="myframe" name="myframe"></iframe>');
                expect(window.myframe).toBeTruthy();
                var mywindow = myframe.window;
				var finished = jasmine.asyncwait.instrumentInterval(mywindow,
						"beforeContent");
				var called = 0;
				runs(function() {
					expect(finished()).toEqual(true);
					var handle = mywindow.setInterval(function() {
						called++;
						if (called == 4) {
							mywindow.clearInterval(handle);
						}
					}, 100);
					expect(finished()).toEqual(false);
				});
				waitsFor(function() {
					return called == 4;
				}, 2000);
				runs(function() {
					expect(finished()).toEqual(true);
				});
			});

			it('should instrument jQuery only afterContent', function() {
				var finished = jasmine.asyncwait.instrumentJQueryAjax(window,
						"beforeContent");
				expect(finished).toEqual(null);
				var finished = jasmine.asyncwait.instrumentJQueryAjax(window,
						"afterContent");
				expect(finished).toBeTruthy();
			});

			it('should detect jquery ajax waiting', function() {
				var callback = null;
				var mockAjax = spyOn(jQuery, 'ajax').andCallFake(
						function(url, options) {
							callback = options.complete;
						});
				var finished = jasmine.asyncwait.instrumentJQueryAjax(window,
						"afterContent");
				expect(finished()).toEqual(true);
				jQuery.ajax("http://myurl");
				expect(finished()).toEqual(false);
				callback();
				expect(finished()).toEqual(true);
			});

			it('should allow jquery ajax complete callback', function() {
				var callback = null;
				var mockAjax = spyOn(jQuery, 'ajax').andCallFake(
						function(url, options) {
							callback = options.complete;
						});
				var finished = jasmine.asyncwait.instrumentJQueryAjax(window);
				var completeCalled = false;
				jQuery.ajax("http://myurl", {
					complete : function() {
						completeCalled = true;
					}
				});
				expect(completeCalled).toEqual(false);
				callback();
				expect(completeCalled).toEqual(true);
			});
			
			it('should instrument animation waiting only afterContent', function() {
                if (!jQuery.fn.animationComplete) {
                    // This depends on the browser features!
                    return;
                }
				var finished = jasmine.asyncwait.instrumentAnimationComplete(window,
						"beforeContent");
				expect(finished).toEqual(null);
				var finished = jasmine.asyncwait.instrumentAnimationComplete(window,
						"afterContent");
				expect(finished).toBeTruthy();
			});

			it(
					'should detect animation waiting',
					function() {
                        if (!jQuery.fn.animationComplete) {
                            // This depends on the browser features!
                            return;
                        }
						var finished = jasmine.asyncwait.instrumentAnimationComplete(window, 'afterContent');
						var animationEnded = false;
						runs(function() {
							$("body")
									.append(
											'<style>@-webkit-keyframes fadein {from { opacity: 0; } to { opacity: 1; }}</style>');
							$("body")
									.append(
											'<div id="anim" style="-webkit-animation-name: \'fadein\';-webkit-animation-duration: 500ms;">hello</div>');
							var to = $("#anim");
							expect(finished()).toEqual(true);
							to.animationComplete(function() {
								animationEnded = true;
							});
							expect(finished()).toEqual(false);
						});
						waitsFor(function() {
							return animationEnded;
						}, 2000);
						runs(function() {
							expect(finished()).toEqual(true);
						});
					});

		});
