VERSION=`cat version.txt`
FILENAME=compiled/jasmine-ui-$VERSION.js
cat build/header.js | sed "s/\${project.version}/$VERSION/"> $FILENAME
SCRIPT_RE=.*script\(\'\\\(.*\\\)\'\)\;.*
cd src
# read in jasmine-ui.js and remote the lines with script('...')
cat jasmine-ui.js | sed "s/$SCRIPT_RE//g" > ../$FILENAME
# read in jasmine-ui.js, search for lines with script('...') and append them to the output file
cat `cat jasmine-ui.js | sed -n "s/$SCRIPT_RE/\1/p"` >> ../$FILENAME

