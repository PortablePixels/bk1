var express = require('express');
var fs = require('fs');
var path = require('path');
var request = require('request');
const exec = require('child_process').exec;
var async = require('async');

var app_dir = path.dirname(require.main.filename);
var plugin_service_url = process.env.PLUGIN_SERVICE_URL || 'https://raw.githubusercontent.com/howdylabs/pluginlist/master'; //https://plugins.botkit.ai';
var plugin_file = app_dir + '/botkit_plugins.json';
var app_modules_folder = app_dir + '/node_modules';


module.exports = function(botkit) {

    var available_plugins, enabled_plugins;

    var plugin = {
        name: 'Manage Plugins',
        web: [{
            url: '/admin/plugins',
            method: 'get',
            handler: function(req, res) {
                var relativePath = path.relative(botkit.LIB_PATH + '/../views', __dirname + '/views');
                res.render(relativePath + '/main',{
                    available_plugins: available_plugins,
                    enabled_plugins: enabled_plugins,
                });
            }
        },
        {
            url: '/admin/api/plugins',
            method: 'get',
            handler: function(req, res) {
                var sorted_list = [];
                for (var p = 0; p < enabled_plugins.length; p++) {
                  sorted_list.push(available_plugins.filter(function(x) {
                    return x.name == enabled_plugins[p].name;
                  })[0]);
                }
                res.json(sorted_list.concat(available_plugins.filter(function(x) { return !x.enabled})));
            }
        },
        {
            url: '/admin/api/plugins',
            method: 'post',
            handler: function(req, res) {
                var plugins = req.body.filter(function(p) { return p.enabled; }).map(function(p) { return {name: p.name, version: p.version}});
                plugin.writePluginFile(plugins).then(function() {
                  res.json({ok:true});
                }).catch(res.json);
            }
        }
        ],
        menu: [{
            title: 'Plugins',
            url: '/admin/plugins',
            icon: '<img src="/icons/gear.png"/>',
        }],
        init: function() {
            botkit.webserver.use("/plugins/plugins", express.static(__dirname + "/public"));
            this.reloadPlugins(botkit).then(function() {
              // emit a success event so botkit can continue to launch
              botkit.trigger('boot:plugins_loaded');
            }).catch(function(err) {
              throw new Error(err);
            });
        },
        writePluginFile: function(plugins) {

          return new Promise(function(resolve, reject) {
            // TODO: Do some sanity checking
            try {
              fs.writeFileSync(plugin_file, JSON.stringify(plugins, null, 2));
              resolve();
            } catch(err) {
              reject(err)
            }
          });

        },
        installWithNPM: function(module_name) {

          console.log('INSTALLING A MODULE', module_name)
          return new Promise(function(resolve, reject) {

            // TODO: Make sure this runs in the right place.  Need to install into bot app, not into Core lib.
            var cmd = 'npm install ' + module_name;
            console.log(cmd);
            var install_proc = exec(cmd, {}, function(err, stdout, stderr) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });

            install_proc.stdout.on('data', console.log);
            install_proc.stderr.on('data', console.error);
          });

        },
        reloadPlugins: function() {
            var that = this;
            return new Promise(function(resolve, reject) {
              getAvailablePlugins(botkit.config.studio_token).then(function(my_available_plugins) {
                available_plugins = my_available_plugins;
                getEnabledPlugins(botkit.config.studio_token).then(function(my_enabled_plugins) {
                    enabled_plugins = my_enabled_plugins;

                    async.each(enabled_plugins, function(this_plugin, next) {

                        // find plugin info
                        var enabled = available_plugins.filter(function(plugin) {
                            return (plugin.name == this_plugin.name)
                        });

                        if (enabled.length == 1) {

                            var plugin = null;
                            try {
                                plugin = require(app_modules_folder + '/' + enabled[0].require);

                                // update the record for display
                                enabled[0].enabled = true;

                                // finally, actual enable this plugin
                                botkit.use(plugin);
                                next();

                            } catch (err) {
                                console.log('Downloading plugin', enabled[0].name);
                                that.installWithNPM(enabled[0].install).then(function() {

                                  plugin = require(app_modules_folder + '/' + enabled[0].require);

                                  // update the record for display
                                  enabled[0].enabled = true;

                                  // finally, actual enable this plugin
                                  botkit.use(plugin);
                                  next();

                                }).catch(function(err) {
                                  console.error('Failed to install plugin', err);
                                  enabled[0].enabled = false
                                  enabled[0].lastError = err;
                                  next(err);
                                });

                            }

                        } else if (enabled.length > 1) {
                            // console.log('FOUND MULTIPLE MATCHING PLUGINS OH NO');
                            next('Found multiple matching plugins');
                        } else {
                            next('Could not find enabled plugin in registry');
                        }
                    }, function(err) {
                      if (err) {
                        reject(err);
                      } else {
                        resolve();
                      }
                    });
                }).catch(function(err) {
                    reject(err);
                })
            }).catch(function(err) {
              reject(err);
            });
          });
        }
    }


    return plugin;
}


function getAvailablePlugins(token) {
    return new Promise(function(resolve, reject) {
        if (!token) {
            reject('Critical Error: Botkit token required to load plugins');
        } else {

            // todo: make this bot-specific
            var url = plugin_service_url + '/list'; // ?access_token=' + token;
            request({
                method: 'get',
                url: url,
            }, function(err, res, body) {
                if (err) {
                    console.error(err);
                    reject('Critical Error: Could not load plugins');
                }

                var available_plugins = JSON.parse(body);

                resolve(available_plugins);

            });
        }
    });




}



function getEnabledPlugins(token) {
    return new Promise(function(resolve, reject) {
        if (!token) {
            reject('Critical Error: Botkit token required to load enabled plugins');
        } else {


            var enabled_plugins = null;
            if (fs.existsSync(plugin_file)) {
                try {
                  enabled_plugins = require(plugin_file);
                } catch(err) {
                  return reject(err);
                }
            } else {
              console.log('botkit_plugins.json not found. No plugins will be enabled.');
            }
            resolve(enabled_plugins || []);

            // var url = plugin_service_url + '/enabled?access_token=' + token;
            // request({
            //     method: 'get',
            //     url: url,
            // }, function(err, res, body) {
            //     if (err) {
            //         console.error(err);
            //         reject('Critical Error: Could not load enabled plugins');
            //     }
            //
            //     var enabked_plugins = JSON.parse(body);
            //
            //     resolve(enabked_plugins);
            //
            // });
        }
    });
}
