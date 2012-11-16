var ejs = require('ejs');
var express = require('express');
var app = express.createServer();
var cfg = require("./build.cfg.js");

app.configure('development', function(){
    app.use(express.static(__dirname));
    app.set('views', "src");
    app.set('view options', { layout: false });
});

app.get("/jasmine-ui.js", function(req, res){
    res.render('jasmine-ui.ejs', cfg);
});

var port = 9000;
app.listen(port);
console.log("listening on port "+port);
