VERSION=`cat version.txt`
FILENAME=compiled/jasmine-ui-$VERSION.js
cat build/header.js | sed "s/\${project.version}/$VERSION/"> $FILENAME
# read in jasmine-ui.js, search for lines with script('...') and append them to the output file
cd src
cat `grep "script('" jasmine-ui.js | sed -n "s/ *script('\(.*\)');/\1/p"` >> ../$FILENAME

