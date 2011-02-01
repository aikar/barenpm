
var bpm = require('./barenpm');
/*bpm.install('promised-io', function(err, suc) {
    if (err) {console.log(err); console.log(err.stack);}
    else console.log(suc); 
  });*/

/*['express', 'binary', 'haml', 'dnode', 'carrier', 'base64', 'step', 'webworker', 'lazy', 'ejs', 'couchdb'].forEach(function(mod) {
  bpm.install(mod, function(err, suc) {
    if (err) {console.log(err); console.log(err.stack);}
    else console.log(); 
  });
})*/
//console.log(process.argv);
if (process.argv[2]  == 'install') {
  var args = process.argv.slice(3).join(' ');
  bpm.install(args);
}

