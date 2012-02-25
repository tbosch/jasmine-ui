var fs  = require("fs");
var carrier = require('carrier');

function readVersion() {
    var res = fs.readFileSync('version.txt', 'utf-8');
    res = res.replace(/\s/g,'');
    return res;
}

var versionPlaceholder = "${project.version}";
var includeRegex = /<jsp:include page="(.*)"\/>/;

function parseFile(version) {
    var input = fs.createReadStream('src/jasmine-ui.jsp');
    var out = fs.createWriteStream('compiled/jasmine-ui-'+version+'.js');
    carrier.carry(input, function(line) {
        line = line.replace(versionPlaceholder, version);
        var match = includeRegex.exec(line);
        if (match) {
            var fileName = match[1];
            line = fs.readFileSync("src/"+fileName,'utf-8');
        }
        out.write(line+'\n');
    });
}

parseFile(readVersion());