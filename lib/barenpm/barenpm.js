var path = require('path'),
    fs   = require('fs'),
	http = require('http');

module.exports = barenpm = {
  getProject: function() {
    var cwd = process.cwd();
    fs.openSync()
  },
  getPackageData: function(module, cb) {
	http.get({
		  host: 'registry.npmjs.org',
		  port: 80,
		  path: '/' + module
	  }, function(res) {
		  if (res.statusCode == 200) {
			  var response = '';
			  res.on('data', function (data) {
				  response += data;
			  }).on('end', function(data){
				  response += data;
				  try {
					  var parsed = JSON.parse(response);
					  cb(null, parsed);
				  } catch(e) {
					  cb(e, null);
				  }
			  }).on('error', function(e){
				  cb(e, null);
			  });
		  } else {
			  cb(new Error("Bad statusCode: " + res.statusCode), null);
		  }
	  }).on('error', function(e) {
		console.log('Got error: ' + e.message);
	  });
  },
  downloadTarball: function(tarball, cb) {

  },
  install: function(name) {
	  var module = name.split('@');
	  var version;
	  if (!module[1]) version = 'latest';
	  else version = module[1];
	  module = module[0];

	  barenpm.getPackageData(module[0], function(meta) {
		if (version == 'latest') {
			version = meta['dist-tags'].latest;
		}
		var pkg = meta.versions[version];
		var tarball = meta.dist.tarball;
		barenpm.downloadTarball(tarball, function(tmpdir) {

		});
	  });
  }
};
x = {
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