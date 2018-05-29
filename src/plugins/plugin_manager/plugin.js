var express = require('express');
var path = require('path');
var WebSocket = require('ws');
var request = require('request');
var plugin_service_url = process.env.PLUGIN_SERVICE_URL || 'https://plugins.botkit.ai';

module.exports = function(botkit) {

    var available_plugins, enabled_plugins;

    var plugin = {
        name: 'Manage Plugins',
        web: [{
            url: '/admin/plugins',
            method: 'get',
            handler: function(req, res) {
                var relativePath = path.relative(process.cwd() + '/views', __dirname + '/views');
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
                res.json(available_plugins);
            }
        },
        {
            url: '/admin/api/plugins',
            method: 'post',
            handler: function(req, res) {
                console.log('GOT UPDATED PLUGINS', req.body);
                res.json({ok:true});
            }
        }
        ],
        menu: [{
            title: 'Plugins',
            url: '/admin/plugins',
            icon: '⚙️',
        }],
        init: function() {
            this.reloadPlugins(botkit);
            botkit.webserver.use("/plugins/plugins", express.static(__dirname + "/public"));
        },
        reloadPlugins: function() {
            var that = this;
            getAvailablePlugins(botkit.config.studio_token).then(function(my_available_plugins) {
                available_plugins = my_available_plugins;
                getEnabledPlugins(botkit.config.studio_token).then(function(my_enabled_plugins) {
                    enabled_plugins = my_enabled_plugins;
                    for (var p = 0; p < enabled_plugins.length; p++) {

                        // find plugin
                        var enabled = available_plugins.filter(function(plugin) {
                            return (plugin.name == enabled_plugins[p].name)
                        });

                        if (enabled.length == 1) {
                            console.log('FOUND A PLUGIN TO ENABLE');


                            // TODO: This should try to npm install the plugin if it isn't found
                            var plugin = null;
                            try {
                                plugin = require(__dirname + '/../../../' + enabled[0].require);
                            } catch (err) {
                                console.error('Failed to load plugin', enabled[0].name);
                                return;
                            }

                            // update the record for display
                            enabled[0].enabled = true;

                            // finally, actual enable this plugin
                            botkit.use(plugin);

                        } else if (enabled.length > 1) {
                            console.log('FOUND MULTIPLE MATCHING PLUGINS OH NO');
                        } else {
                            console.log('COUND NOT FIND ENABLED PLUGIN!!');
                        }

                    }
                }).catch(function(err) {
                    console.error(err);
                    process.exit(1);
                })
            }).catch(function(err) {
                console.error(err);
                process.exit(1);
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

            var url = plugin_service_url + '/list?access_token=' + token;
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
        // reject('Critical Error: Could not load plugins');
    });
}



function getEnabledPlugins(token) {
    return new Promise(function(resolve, reject) {
        if (!token) {
            reject('Critical Error: Botkit token required to load enabled plugins');
        } else {

            var url = plugin_service_url + '/enabled?access_token=' + token;
            request({
                method: 'get',
                url: url,
            }, function(err, res, body) {
                if (err) {
                    console.error(err);
                    reject('Critical Error: Could not load enabled plugins');
                }

                var enabked_plugins = JSON.parse(body);

                resolve(enabked_plugins);

            });
        }
    });
}
