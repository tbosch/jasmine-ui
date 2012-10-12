var cfg = require("./build.cfg.js");
var ejs = require('ejs');
var fs = require('fs');

var modules = ['jasmine-ui'];

modules.forEach(function(module) {
    var fileName = 'src/'+module+'.ejs';
    var content = fs.readFileSync(fileName, 'utf-8');
    var rendered = ejs.compile(content, {
        filename: fileName
    })(cfg);
    fs.writeFileSync('compiled/'+module+'-'+cfg.version+'.js', rendered);
});
