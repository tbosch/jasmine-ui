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
// Allow jasmine to be defined before jasmine-ui separately. Needed for
// js-test-driver integration, as the js-test-driver adapter does not know
// about describeUi.
if (!window.jasmine) {
<jsp:include page="../lib/jasmine.js"/>
}
<jsp:include page="simpleRequire.js"/>
<jsp:include page="scriptAccessor.js"/>
<jsp:include page="logger.js"/>
<jsp:include page="globals.js"/>
<jsp:include page="persistentData.js"/>
<jsp:include page="jasmineApi.js"/>
<jsp:include page="loadUrl.js"/>
<jsp:include page="asyncSensor.js"/>
<jsp:include page="loadEventSupport.js"/>
<jsp:include page="simulateEvent.js"/>
<jsp:include page="jasmineUtils.js"/>
<jsp:include page="describeUiServer.js"/>
<jsp:include page="describeUiClient.js"/>
<jsp:include page="main.js"/>

