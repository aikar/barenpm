var path  = require('path'),
    fs    = require('fs'),
    http  = require('http'),
    spawn = require('child_process').spawn,
    exec  = require('child_process').exec,
    url   = require('url');
    
var project;
var bpm = {
  _project: null,
  _pkglist: [],
  _getProjectPending: false,
  _pendingGetProjectsCb: [],
  
  init: function(cb) {
    if (module && module.parent && module.parent.filename) {
      var dir = path.dirname(module.parent.filename) + '/';
      try {
        var data = fs.readFileSync(dir + '.bpmrc');
        var project = eval('(' + data.toString() + ')');
        if (project.libs) {
          project.libs = path.join(dir + project.libs);
          if (require.paths.indexOf(project.libs) == -1) {
            require.paths.unshift(project.libs);
          }
        }
      } catch(e) {
      }
    }
  },
  getProject: function(cb) {
    if (!bpm._project) {
      bpm._pendingGetProjectsCb.push(cb);    
      if (!bpm._getProjectPending) {
        bpm._getProjectPending = true;
        var execCb = function() {
          bpm._pendingGetProjectsCb.forEach(function(acb) {
            acb(bpm._project);
          });
        };
        
        fs.readFile(process.cwd() + '/.bpmrc', function(err, data) {
          if (err || !data || !data.length) {
            data = '{libs:"libs"}';
            fs.writeFile(process.cwd() + '/.bpmrc', data);
          }
          try {
            bpm._project = eval('(' + data.toString() + ')');
          } catch(e) {
            bpm._project = {libs: "libs"};
            data = '{libs:"libs"}';
            fs.writeFile(process.cwd() + '/.bpmrc', data);
          }
          
          bpm._project.libs = process.cwd() + '/' + (bpm._project.libs || "libs");
          
          path.exists(bpm._project.libs, function(exists) {
            if (!exists) {
              //console.log('dir doesnt exists' + bpm._project.libs);
              exec('mkdir -p "' + bpm._project.libs +'"', function(err, stdout) {
                if (!err) {
                  execCb();
                } else {
                  throw new Exception("Error: Could not make directory: " + bpm._project.libs);
                }
              });
            } else {
              execCb();
            }  
          });
        });
      }
    } else {
      cb(bpm._project);
    }
  },
  get: function(req, cb) {
    http.get(req, function parseres(res) {
      if (res.statusCode == 301 || res.headers.location) {
        var newurl = url.parse(res.headers.location);
        http.get({
          host: newurl.hostname,
          port: newurl.port || 80,
          path: newurl.pathname || '/'
        }, parseres);
      } else {
        cb(res);
      }
    });
  },
  getPackageData: function(module, cb) {
    var req = {
      host: 'registry.npmjs.org',
      port: 80,
      path: '/' + module
    };
    
    bpm.get(req, function(res) {
      if (res.statusCode == 200) {
        var response = '';
        res.on('data', function (data) {
          response += data.toString();
        }).on('end', function() {
          try {
            //console.log(response);
            var parsed = JSON.parse(response);
            cb(null, parsed);
         } catch(e) {
            cb(e);
         }
        });
      } else {
        //console.log(res);
        cb(new Error(module + " - Bad statusCode: " + res.statusCode), null);
      }
    });
  },
  downloadTarball: function(tarball, module, cb) {
    var tmpdir = '/tmp/bpm-' + Date.now() + '-' + Math.random() + '/';
    exec('mkdir -p ' + tmpdir, function(err, stdout) {
    exec("curl -s '" + tarball + "' | tar -vxzpf - -C '" + tmpdir + "'",
      function(err, stdout, stderr) {
        if (err) {
          cb(new Error('Didnt work ' + stderr + ' : ' + stdout));
        } else {
          path.exists(tmpdir + 'package/package.json', function(exists) {
             if (exists) {
               cb(null, tmpdir + 'package/');
             } else {
               fs.readdir(tmpdir, function(err, files) {
                 if (!err && files && files[0]) {
                   path.exists(tmpdir + files[0] + '/package.json', function(exists) {
                     if (exists) {
                       cb(null, tmpdir + files[0] + '/');
                     } else {
                       cb(new Error('Could not find package in tarball for ' + module));
                     }
                   });
                 } else {
                   cb(new Error('Could not find files in tarball ' + module + files[0]));
                 }
               });
             }
          });
        
        }
      }
    );
    });
  },
  install: function(name, cb) {
    bpm.getProject(function(project) {
      var modules = name.split(' ');
      var count = modules.length;
      modules.forEach(function(name) {
        
        bpm.installModule(name, function (err, suc) {
          count--;
          if (err) {
            if(typeof cb == 'function') {
              cb(err);
            } else {
              console.log('Error', err, err.stack);
            }
          } else {
            if(!count) {
                console.log('Module(s) installed!');
              
            }
          }
        });
      });
    });
  },
  installModule: function(name, cb) {
    var ag = arguments;
    var module = name.split('@');
    var version;
    if (!module[1]) version = 'latest';
    else version = module[1];
    module = module[0];
    if (bpm._pkglist.indexOf(module) == -1) {
      bpm._pkglist.push(module);
      bpm.getPackageData(module, function(err, meta) {
        if (err) {
          cb(err, null);
        } else {
          if (version == 'latest') {
            version = meta['dist-tags'].latest;
          }
          var pkg = meta.versions[version];
          var tarball = pkg.dist.tarball;
          
          var deps = Object.keys(pkg.dependencies || {});
          
          
          
          deps.forEach(function(dep) {
            bpm.installModule(dep, cb);
          });
          console.log('Downloading - ' + module + '@' + version + ': ' + tarball);
          if(module == 'lazy') {
            console.log(ag)
            console.log(bpm._pkglist);
          }
          bpm.downloadTarball(tarball, module, function(err, tmpdir) {
            if (err) cb(err);
            else {
              bpm.installPackage(pkg, tmpdir, 
                function(err, succ) {
                if (err) {
                  // this is for safety to ensure we don't try to rm -rf /
                  var cmd = 'rm -rf /tmp/bpm-' + tmpdir.substr(7);
                  console.log('Failed to install ' + module);
                  exec(cmd);
                  cb(err);
                } else {
                  cb(null, 1);
                  console.log(module + ' Installed!');
                  var idx = bpm._pkglist.indexOf(module);
                  //bpm._pkglist.splice(idx, 1);
                }
              });
            }
          });
        }
      });
    }
  },
  moveDirToLibs: function(tmp, dir, cb) {
    if(dir && !dir.indexOf(process.cwd())) {
      exec('rm -rf ' + dir, function(err, stdout) {
        if (!err) {
          exec('mkdir -p "'+ dir +'"', function (err, suc) {
            if (!err) {
              exec('mv "' + tmp + '" "' + dir +'.bpm/"', function(err, stdout) {
                if (!err) {
                  fs.readFile(dir + '.bpm/package.json', function(err, json) {
                    if (!err) {
                      json = json.toString();
                      try {
                        var pkg = eval('(' + json + ')');
                        cb(null, pkg);
                      } catch (e) {
                        cb(new Error('Failed to parse tarballs package.json: '
                           + e.message + ' - ' + dir + ' : ' + json)); 
                      }
                    } else {
                      cb(new Error('Could not find a package.json in ' + dir));
                    }
                  });
                } else {
                  cb(new Error('Failed to move ' + tmp + ' to ' + dir + '/.bpm/'));
                }
              });
            } else {
              cb(new Error('Failed to create ' + dir));
            }
          });
        } else {
          cb(new Error('Failed to delete ' + dir));
        }
      })
    }
  },
  indexFileTemplate: function(file) {
    return 'module.exports = require("' + file + '");';
  },
  linkFile: function(from, to) {
    fs.writeFile(from, bpm.indexFileTemplate(to));
  },
  installPackage: function(pkg, tmpdir, cb) {
    var module = pkg.name;
    
    var pkgdir = bpm._project.libs + '/' + module + '/';
    
    bpm.moveDirToLibs(tmpdir, pkgdir, function(err, xpkg) {
      if (err) {
        cb(err);
        return;
      }
      var bpmdir = pkgdir + '.bpm/';      
      pkg.modules = pkg.modules || {};
      
      var libdir = pkg.directories && pkg.directories.lib || pkg.lib;
      
      if (!pkg.modules['index.js'] && pkg.main) pkg.modules['index.js'] = pkg.main;
      if (!pkg.modules['index.js'] && !pkg.main && pkg.modules[pkg.name]) {
        pkg.modules['index.js'] = pkg.modules[pkg.name];
      }
      
      
      if (libdir) {
        var file = fs.readdir(bpmdir + libdir, function(err, files) {
          if (!err) {
            files.forEach(function(file) {
              if (file.match(/\.(js|node)/) && !pkg.modules[file]) {
                pkg.modules[file] = libdir + '/' + file;
              }
            });
            _linkModules();
          }
        });  
      } else {
        _linkModules();
      }
      function _linkModules() {
        if (!pkg.modules['index.js'] && pkg.modules['index']) {
          pkg.modules['index.js'] = pkg.modules['index'];
          delete pkg.modules['index'];
        }
        if (!pkg.modules['index.js'] && !pkg.modules['index']) {
          pkg.modules['index.js'] = 'index.js';
        }
        var modules = Object.keys(pkg.modules);
        
        modules.forEach(function(from) {
          
          var to = './.bpm/' + path.join(pkg.modules[from]);
          
          if (!path.extname(from)) from += '.js';
          
          if (from.match(/\.(js|node)$/)) {
            var fromBase = path.dirname(from);
            var depthCount = fromBase.split('/').length;
            if (fromBase == '.') depthCount = 0;
            if(depthCount) {
              to = Array(depthCount+1).join('../') + path.join(to);
            }
            
            exec("mkdir -p '" + pkgdir + fromBase + "'", function(err, stdout) {
              bpm.linkFile(pkgdir + from, to)
            });
          }
        });
        cb(null, "Finished: ", pkg.name);
      }
    });
  }
};

module.exports = {
  //init: bpm.init,
  install: bpm.install
};
bpm.init();

v = {"name":"promised-io","author":{"name":"Kris Zyp"},"description":"Promise-based IO","licenses":[{"type":"AFLv2.1","url":"http://trac.dojotoolkit.org/browser/dojo/trunk/LICENSE#L43"},{"type":"BSD","url":"http://trac.dojotoolkit.org/browser/dojo/trunk/LICENSE#L13"}],"repository":{"type":"git","url":"http://github.com/kriszyp/promised-io"},"contributors":["Dean Landolt <dean@deanlandolt.com","Nathan Stott <nathan.stott@whiteboard-it.com>","Mark Wubben <mark@novemberborn.net>","Vladimir Dronnikov <dronnikov@gmail.com>"],"keywords":["promise","io"],"mappings":{"patr":"http://github.com/kriszyp/patr/zipball/v0.2.1"},"directories":{"lib":"./lib"},"dependencies":{"patr":">=0.2.1"},"repositories":[{"type":"git","url":"https://github.com/kriszyp/promised-io"}],"id":"promised-io","versions":{"master":{"name":"promised-io","version":"master","dist":{"tarball":"https://github.com/kriszyp/promised-io/tarball/master","zip":"https://github.com/kriszyp/promised-io/zipball/master"},"dependencies":{"patr":"0.2.1"}},"kriszyp-master":{"name":"promised-io","version":"kriszyp-master","dist":{"tarball":"https://github.com/kriszyp/promised-io/tarball/master","zip":"https://github.com/kriszyp/promised-io/zipball/master"},"dependencies":{"patr":"0.2.1"}},"0.2.0":{"name":"promised-io","version":"0.2.0","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.0","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.0"},"dependencies":{}},"kriszyp-0.2.0":{"name":"promised-io","version":"kriszyp-0.2.0","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.0","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.0"},"dependencies":{}},"0.2.1":{"name":"promised-io","version":"0.2.1","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.1","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.1"},"dependencies":{}},"kriszyp-0.2.1":{"name":"promised-io","version":"kriszyp-0.2.1","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.1","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.1"},"dependencies":{}},"0.2.2":{"name":"promised-io","version":"0.2.2","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.2","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.2"},"dependencies":{"patr":"0.2.1"}},"kriszyp-0.2.2":{"name":"promised-io","version":"kriszyp-0.2.2","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.2","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.2"},"dependencies":{"patr":"0.2.1"}},"id":"promised-io","0.2.3":{"name":"promised-io","version":"0.2.3","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.3","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.3"},"dependencies":{"patr":"0.2.5"}},"kriszyp-0.2.3":{"name":"promised-io","version":"kriszyp-0.2.3","dist":{"tarball":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Ftarball$2Fv0.2.3","zip":"http://packages.dojofoundation.org/archives/https$3A$2F$2Fgithub.com$2Fkriszyp$2Fpromised-io$2Fzipball$2Fv0.2.3"},"dependencies":{"patr":"0.2.5"}}},"dist-tags":{"latest":"0.2.3"}}
x = {
  x:{
    "_id":"express",
    "_rev":"31-61013cd67626371a1b09511be46e219d",
    "name":"express",
    "description":"Sinatra inspired web development framework",
    "dist-tags":{
      "latest":"1.0.3"
    },
    "versions":{
      "0.14.0":{
        "name":"express",
        "description":"Sinatra inspired web development framework",
        "version":"0.14.0",
        "author":{
          "name":"TJ Holowaychuk",
          "email":"tj@vision-media.ca"
        },
        "contributors":[{
          "name":"TJ Holowaychuk",
          "email":"tj@vision-media.ca"
        },{
          "name":"Aaron Heckmann",
          "email":"aaron.heckmann+github@gmail.com"
        },{
          "name":"Ciaran Jessup",
          "email":"ciaranj@gmail.com"
        }],
        "keywords":["framework","sinatra","web","rest","restful"],
        "directories":{
          "lib":"./lib"
        },
        "scripts":{
          "test":"make test"
        },
        "engines":{
          "node":">= 0.1.98"
        },
        "_id":"express@0.14.0",
        "_nodeSupported":true,
        "_npmVersion":"0.2.7-2",
        "_nodeVersion":"v0.3.1-pre",
        "dist":{
          "tarball":"http://registry.npmjs.org/express/-/express-0.14.0.tgz"
        }
      },
    "0.14.1":{
      "name":"express",
      "description":"Sinatra inspired web development framework",
      "version":"0.14.1",
      "author":{
        "name":"TJ Holowaychuk",
        "email":"tj@vision-media.ca"
      },
      "contributors":[{
        "name":"TJ Holowaychuk",
        "email":"tj@vision-media.ca"
      },{
        "name":"Aaron Heckmann",
        "email":"aaron.heckmann+github@gmail.com"
      },{
        "name":"Ciaran Jessup",
        "email":"ciaranj@gmail.com"
      }],
      "keywords":["framework","sinatra","web","rest","restful"],
      "directories":{
        "lib":"./lib"
      },
      "scripts":{
        "test":"make test"
      },
      "engines":{
        "node":">= 0.1.98"
      },
      "_id":"express@0.14.1",
      "_nodeSupported":true,
      "_npmVersion":"0.2.7-2",
      "_nodeVersion":"v0.3.1-pre",
      "dist":{
        "tarball":"http://registry.npmjs.org/express/-/express-0.14.1.tgz"
      }
    },
  "1.0.0beta":{
    "name":"express",
    "description":"Sinatra inspired web development framework",
    "version":"1.0.0beta",
    "author":{
      "name":"TJ Holowaychuk",
      "email":"tj@vision-media.ca"
    },
    "contributors":[{
      "name":"TJ Holowaychuk",
      "email":"tj@vision-media.ca"
    },{
      "name":"Aaron Heckmann",
      "email":"aaron.heckmann+github@gmail.com"
    },{
      "name":"Ciaran Jessup",
      "email":"ciaranj@gmail.com"
    }],
    "keywords":["framework","sinatra","web","rest","restful"],
    "directories":{
      "lib":"./lib/express"
    },
    "scripts":{
      "test":"make test"
    },
    "bin":{
      "express":"./bin/express"
    },
    "engines":{
      "node":">= 0.1.98"
    },
    "_id":"express@1.0.0beta",
    "_nodeSupported":true,
    "_npmVersion":"0.2.7-2",
    "_nodeVersion":"v0.3.1-pre",
    "dist":{
      "tarball":"http://registry.npmjs.org/express/-/express-1.0.0beta.tgz"
    }
  },
"1.0.0beta2":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.0beta2",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  }],
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"express@1.0.0beta2",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.0beta2.tgz"
  }
},
"1.0.0rc":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.0rc",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.2.2"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"express@1.0.0rc",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.0rc.tgz"
  }
},
"1.0.0rc2":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.0rc2",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.2.4"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"express@1.0.0rc2",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.0rc2.tgz"
  }
},
"1.0.0rc3":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.0rc3",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.2.5"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.2.0"
  },
  "_id":"express@1.0.0rc3",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.0rc3.tgz"
  }
},
"1.0.0rc4":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.0rc4",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  },{
    "name":"Guillermo Rauch",
    "email":"rauchg@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.2.6"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.2.0"
  },
  "_id":"express@1.0.0rc4",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.0rc4.tgz"
  }
},
"1.0.0":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.0",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  },{
    "name":"Guillermo Rauch",
    "email":"rauchg@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.3.0"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.2.0"
  },
  "_id":"express@1.0.0",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-3",
  "_nodeVersion":"v0.2.4",
  "dist":{
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.0.tgz"
  }
},
"1.0.1":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.1",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  },{
    "name":"Guillermo Rauch",
    "email":"rauchg@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.3.0"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.2.0"
  },
  "_id":"express@1.0.1",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.5",
  "dist":{
    "shasum":"53ad8442c3feb46588f08698f1872c4dbf24137f",
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.1.tgz"
  }
},
"1.0.2":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.2",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  },{
    "name":"Guillermo Rauch",
    "email":"rauchg@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.3.0"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.2.0"
  },
  "_id":"express@1.0.2",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.6",
  "dist":{
    "shasum":"5985fd1986b2275d8e96976a8b8de011dc823e0d",
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.2.tgz"
  }
},
"1.0.3":{
  "name":"express",
  "description":"Sinatra inspired web development framework",
  "version":"1.0.3",
  "author":{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Aaron Heckmann",
    "email":"aaron.heckmann+github@gmail.com"
  },{
    "name":"Ciaran Jessup",
    "email":"ciaranj@gmail.com"
  },{
    "name":"Guillermo Rauch",
    "email":"rauchg@gmail.com"
  }],
  "dependencies":{
    "connect":">= 0.3.0"
  },
  "keywords":["framework","sinatra","web","rest","restful"],
  "directories":{
    "lib":"./lib/express"
  },
  "scripts":{
    "test":"make test"
  },
  "bin":{
    "express":"./bin/express"
  },
  "engines":{
    "node":">= 0.2.0"
  },
  "_id":"express@1.0.3",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.6",
  "dist":{
    "shasum":"e07fd860c4af7ffddc77653fd1fd930fce26cb61",
    "tarball":"http://registry.npmjs.org/express/-/express-1.0.3.tgz"
  }
}
},
"maintainers":[{
  "name":"tjholowaychuk",
  "email":"tj@vision-media.ca"
}],
"author":{
  "name":"TJ Holowaychuk",
  "email":"tj@vision-media.ca"
},
"time":{
  "0.14.0":"2010-12-29T19:38:25.450Z",
  "0.14.1":"2010-12-29T19:38:25.450Z",
  "1.0.0beta":"2010-12-29T19:38:25.450Z",
  "1.0.0beta2":"2010-12-29T19:38:25.450Z",
  "1.0.0rc":"2010-12-29T19:38:25.450Z",
  "1.0.0rc2":"2010-12-29T19:38:25.450Z",
  "1.0.0rc3":"2010-12-29T19:38:25.450Z",
  "1.0.0rc4":"2010-12-29T19:38:25.450Z",
  "1.0.0":"2010-12-29T19:38:25.450Z",
  "1.0.1":"2010-12-29T19:38:25.450Z",
  "1.0.2":"2011-01-11T02:09:30.004Z",
  "1.0.3":"2011-01-13T22:09:07.840Z"
}
},
  "_id":"connect",
  "_rev":"53-5421b3598eb1de2a903d7b37e5a30c0c",
  "name":"connect",
  "description":"High performance middleware framework",
  "dist-tags":{
    "latest":"0.5.6"
  },
  "versions":{
    "0.0.1":{
      "name":"connect",
      "description":"High performance middleware",
      "version":"0.0.1",
      "contributors":[{
        "name":"Tim Caswell",
        "email":"tim@extjs.com"
      },{
        "name":"TJ Holowaychuk",
        "email":"tj@extjs.com"
      }],
      "bin":{
        "connect":"./bin/connect"
      },
      "directories":{
        "lib":"./lib/connect"
      },
      "scripts":{
        "activate":"make install-docs",
        "test":"make test",
        "deactivate":"make uninstall"
      },
      "engines":{
        "node":">= 0.1.98"
      },
      "_id":"connect@0.0.1",
      "_nodeSupported":true,
      "_npmVersion":"0.2.7-2",
      "_nodeVersion":"v0.3.1-pre",
      "dist":{
        "tarball":"http://registry.npmjs.org/connect/-/connect-0.0.1.tgz"
      }
    },
  "0.0.2":{
    "name":"connect",
    "description":"High performance middleware",
    "version":"0.0.2",
    "contributors":[{
      "name":"Tim Caswell",
      "email":"tim@extjs.com"
    },{
      "name":"TJ Holowaychuk",
      "email":"tj@extjs.com"
    }],
    "bin":{
      "connect":"./bin/connect"
    },
    "directories":{
      "lib":"./lib/connect"
    },
    "scripts":{
      "activate":"make install-docs",
      "test":"make test",
      "deactivate":"make uninstall"
    },
    "engines":{
      "node":">= 0.1.98-0"
    },
    "_id":"connect@0.0.2",
    "_nodeSupported":true,
    "_npmVersion":"0.2.7-2",
    "_nodeVersion":"v0.3.1-pre",
    "dist":{
      "tarball":"http://registry.npmjs.org/connect/-/connect-0.0.2.tgz"
    }
  },
"0.0.3":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.0.3",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98-0"
  },
  "_id":"connect@0.0.3",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.0.3.tgz"
  }
},
"0.0.4":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.0.4",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.0.4",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.0.4.tgz"
  }
},
"0.0.5":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.0.5",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.0.5",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.0.5.tgz"
  }
},
"0.0.6":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.0.6",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.0.6",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.0.6.tgz"
  }
},
"0.1.0":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.1.0",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.1.0",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.1.0.tgz"
  }
},
"0.2.0":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.2.0",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.0",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.0.tgz"
  }
},
"0.2.1":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.2.1",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@extjs.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@extjs.com"
  }],
  "bin":{
    "connect":"./bin/connect"
  },
  "directories":{
    "lib":"./lib/connect"
  },
  "scripts":{
    "activate":"make install-docs",
    "test":"make test",
    "deactivate":"make uninstall"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.1",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.1.tgz"
  }
},
"0.2.2":{
  "name":"connect",
  "description":"High performance middleware",
  "version":"0.2.2",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.2",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.2.tgz"
  }
},
"0.2.3":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.2.3",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.3",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.3.tgz"
  }
},
"0.2.4":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.2.4",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.4",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.4.tgz"
  }
},
"0.2.5":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.2.5",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.5",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.5.tgz"
  }
},
"0.2.6":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.2.6",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.6",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.6.tgz"
  }
},
"0.2.7":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.2.7",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.2.7",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-2",
  "_nodeVersion":"v0.3.1-pre",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.2.7.tgz"
  }
},
"0.3.0":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.3.0",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.3.0",
  "_nodeSupported":true,
  "_npmVersion":"0.2.7-3",
  "_nodeVersion":"v0.2.4",
  "dist":{
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.3.0.tgz"
  }
},
"0.4.0":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.4.0",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.4.0",
  "_nodeSupported":true,
  "_npmVersion":"0.2.10",
  "_nodeVersion":"v0.2.5",
  "dist":{
    "shasum":"98046399291a04efd889643267c8fba17a695ba1",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.4.0.tgz"
  }
},
"0.5.0":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.0",
  "contributors":[{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  },{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.5.0",
  "_nodeSupported":true,
  "_npmVersion":"0.2.11-1",
  "_nodeVersion":"v0.2.5",
  "dist":{
    "shasum":"c9a1814ba8fa92f2c4910493c568327c0950d977",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.0.tgz"
  }
},
"0.5.1":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.1",
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.5.1",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.5",
  "dist":{
    "shasum":"781da5f8c13cc40f0003c02ac824ed7700bb08bf",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.1.tgz"
  }
},
"0.5.2":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.2",
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.5.2",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.5",
  "dist":{
    "shasum":"b12c970fe10d75abe0b82c792762ccb7d6d88833",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.2.tgz"
  }
},
"0.5.3":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.3",
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.5.3",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.5",
  "dist":{
    "shasum":"2c27ca3f47b8a27cef5d5a9a6c18a1880cbe8a84",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.3.tgz"
  }
},
"0.5.4":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.4",
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.1.98"
  },
  "_id":"connect@0.5.4",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.6",
  "dist":{
    "shasum":"2b331adf355dc5911958d570b3610f2bd93ffbb7",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.4.tgz"
  }
},
"0.5.5":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.5",
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.2.2"
  },
  "_id":"connect@0.5.5",
  "_engineSupported":true,
  "_npmVersion":"0.2.13-1",
  "_nodeVersion":"v0.2.6",
  "dist":{
    "shasum":"a9f71e934983118cd5ccfcdb704ac9764d97a145",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.5.tgz"
  }
},
"0.5.6":{
  "name":"connect",
  "description":"High performance middleware framework",
  "version":"0.5.6",
  "contributors":[{
    "name":"TJ Holowaychuk",
    "email":"tj@vision-media.ca"
  },{
    "name":"Tim Caswell",
    "email":"tim@sencha.com"
  }],
  "directories":{
    "lib":"./lib/connect"
  },
  "engines":{
    "node":">= 0.2.2"
  },
  "_id":"connect@0.5.6",
  "_engineSupported":true,
  "_npmVersion":"0.2.15",
  "_nodeVersion":"v0.2.6",
  "modules":{
    "index.js":"lib/connect/index.js",
    "utils.js":"lib/connect/utils.js",
    "public/error.html":"lib/connect/public/error.html",
    "public/favicon.ico":"lib/connect/public/favicon.ico",
    "public/style.css":"lib/connect/public/style.css",
    "middleware/basicAuth.js":"lib/connect/middleware/basicAuth.js",
    "middleware/bodyDecoder.js":"lib/connect/middleware/bodyDecoder.js",
    "middleware/cache.js":"lib/connect/middleware/cache.js",
    "middleware/cacheManifest.js":"lib/connect/middleware/cacheManifest.js",
    "middleware/compiler.js":"lib/connect/middleware/compiler.js",
    "middleware/conditionalGet.js":"lib/connect/middleware/conditionalGet.js",
    "middleware/cookieDecoder.js":"lib/connect/middleware/cookieDecoder.js",
    "middleware/errorHandler.js":"lib/connect/middleware/errorHandler.js",
    "middleware/favicon.js":"lib/connect/middleware/favicon.js",
    "middleware/gzip-compress.js":"lib/connect/middleware/gzip-compress.js",
    "middleware/gzip-proc.js":"lib/connect/middleware/gzip-proc.js",
    "middleware/gzip.js":"lib/connect/middleware/gzip.js",
    "middleware/lint.js":"lib/connect/middleware/lint.js",
    "middleware/logger.js":"lib/connect/middleware/logger.js",
    "middleware/methodOverride.js":"lib/connect/middleware/methodOverride.js",
    "middleware/repl.js":"lib/connect/middleware/repl.js",
    "middleware/router.js":"lib/connect/middleware/router.js",
    "middleware/session.js":"lib/connect/middleware/session.js",
    "middleware/staticGzip.js":"lib/connect/middleware/staticGzip.js",
    "middleware/staticProvider.js":"lib/connect/middleware/staticProvider.js",
    "middleware/vhost.js":"lib/connect/middleware/vhost.js",
    "middleware/session/memory.js":"lib/connect/middleware/session/memory.js",
    "middleware/session/session.js":"lib/connect/middleware/session/session.js",
    "middleware/session/store.js":"lib/connect/middleware/session/store.js"
  },
  "files":[""],
  "_defaultsLoaded":true,
  "dist":{
    "shasum":"3d4e5f913bfc88c4642ab1e86a58ecffbdda8b34",
    "tarball":"http://registry.npmjs.org/connect/-/connect-0.5.6.tgz"
  }
}
},
"maintainers":[{
  "name":"tjholowaychuk",
  "email":"tj@vision-media.ca"
},{
  "name":"creationix",
  "email":"tim@creationix.com"
}],
"time":{
  "0.0.1":"2010-12-28T11:06:24.976Z",
  "0.0.2":"2010-12-28T11:06:24.976Z",
  "0.0.3":"2010-12-28T11:06:24.976Z",
  "0.0.4":"2010-12-28T11:06:24.976Z",
  "0.0.5":"2010-12-28T11:06:24.976Z",
  "0.0.6":"2010-12-28T11:06:24.976Z",
  "0.1.0":"2010-12-28T11:06:24.976Z",
  "0.2.0":"2010-12-28T11:06:24.976Z",
  "0.2.1":"2010-12-28T11:06:24.976Z",
  "0.2.2":"2010-12-28T11:06:24.976Z",
  "0.2.3":"2010-12-28T11:06:24.976Z",
  "0.2.4":"2010-12-28T11:06:24.976Z",
  "0.2.5":"2010-12-28T11:06:24.976Z",
  "0.2.6":"2010-12-28T11:06:24.976Z",
  "0.2.7":"2010-12-28T11:06:24.976Z",
  "0.3.0":"2010-12-28T11:06:24.976Z",
  "0.4.0":"2010-12-28T11:06:24.976Z",
  "0.5.0":"2010-12-28T11:06:24.976Z",
  "0.5.1":"2010-12-28T11:06:24.976Z",
  "0.5.2":"2010-12-28T12:02:37.013Z",
  "0.5.3":"2011-01-05T19:53:11.213Z",
  "0.5.4":"2011-01-07T17:53:05.190Z",
  "0.5.5":"2011-01-13T18:57:39.841Z",
  "0.5.6":"2011-01-23T08:23:42.157Z"
}
}
