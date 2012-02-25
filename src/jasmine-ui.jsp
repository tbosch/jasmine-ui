/**
* Jasmine-Ui v${project.version}
* http://github.com/tigbro/jquery-mobile-angular-adapter
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
<jsp:include page="jasmineApi.js"/>
<jsp:include page="server/describeUi.js"/>
<jsp:include page="server/testwindow.js"/>
<jsp:include page="client/asyncSensor.js"/>
<jsp:include page="client/describeUi.js"/>
<jsp:include page="client/loadEventSupport.js"/>
<jsp:include page="client/simulateEvent.js"/>
<jsp:include page="main.js"/>

