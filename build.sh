VERSION=`cat version.txt`
FILENAME=compiled/jasmine-ui-$VERSION.js
cat build/header.js | sed "s/\${project.version}/$VERSION/"> $FILENAME
cat src/simple-require.js >> $FILENAME
cat src/scriptAccessor.js >> $FILENAME
cat src/logger.js >> $FILENAME
cat src/server/asyncWaitServer.js >> $FILENAME
cat src/server/clientInvoker.js >> $FILENAME
cat src/server/desribeUi.js >> $FILENAME
cat src/server/jasmineApi.js >> $FILENAME
cat src/server/loadHtml.js >> $FILENAME
cat src/server/remoteSpecServer.js >> $FILENAME
cat src/server/testwindow.js >> $FILENAME
cat src/client/remoteSpecClient.js >> $FILENAME
cat src/client/serverInvoker.js >> $FILENAME
cat src/client/asyncWaitClient.js >> $FILENAME
cat src/client/errorHandler.js >> $FILENAME
cat src/simulateEvent.js >> $FILENAME
cat src/eventListener.js >> $FILENAME
cat src/main.js >> $FILENAME
cat build/footer.js >> $FILENAME

