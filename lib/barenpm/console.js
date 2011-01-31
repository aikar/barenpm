
var bpm = require('./barenpm');
bpm.install('promised-io', function(err, suc) {
    if (err) {console.log(err); console.log(err.stack);}
    else console.log(suc); 
  });
/*
['binary', 'haml', 'dnode', 'carrier', 'base64', 'step', 'webworker', 'lazy', 'ejs', 'couchdb'].forEach(function(mod) {
  bpm.install(mod, function(err, suc) {
    if (err) {console.log(err); console.log(err.stack);}
    else console.log(suc); 
  });
})*/

