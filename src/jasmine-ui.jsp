/**
* Jasmine-Ui v${project.version}
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
<jsp:include page="../lib/jasmine.js"/>
}
if (window.jstestdriver) {
<jsp:include page="../test/lib/JasmineAdapter.js"/>
}
<jsp:include page="simpleRequire.js"/>
<jsp:include page="config.js"/>
<jsp:include page="urlLoader.js"/>
<jsp:include page="scriptAccessor.js"/>
<jsp:include page="logger.js"/>
<jsp:include page="globals.js"/>
<jsp:include page="persistentData.js"/>
<jsp:include page="jasmineApi.js"/>
<jsp:include page="asyncSensor.js"/>
<jsp:include page="waitsForAsync.js"/>
<jsp:include page="loadListener.js"/>
<jsp:include page="simulateEvent.js"/>
<jsp:include page="jasmineUtils.js"/>
<jsp:include page="describeUiServer.js"/>
<jsp:include page="describeUiClient.js"/>
<jsp:include page="utils.js"/>
<jsp:include page="main.js"/>

