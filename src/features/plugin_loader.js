var debug = require('debug')('botkit:plugins');
var menu = [];
var plugins = [];

module.exports = function(botkit) {

    if (botkit.webserver) {
        botkit.webserver.use(function(req, res, next) {

            res.locals.menu = menu;
            res.locals.plugins = plugins;
            next();

        });
    }

    var harness = {
        use: function(plugin) {
          if (typeof(plugin)=='function') {
            plugin = plugin(botkit);
          }
          try {
              harness.register(plugin.name, plugin);
          } catch(err) {
              console.log('ERROR IN REGISTER', err);
          }
        },
        register: function(name, endpoints) {

            debug('Enabling plugin: ', name);
            if (plugins.indexOf(name) >= 0) {
                debug('Plugin already enabled:', name);
                return;
            }
            plugins.push(name);

            // register all the web endpoints
            if (endpoints.web) {
                for (var e = 0; e < endpoints.web.length; e++) {
                    var endpoint = endpoints.web[e];
                    switch (endpoint.method.toLowerCase()) {
                        case 'get':
                            botkit.webserver.get(endpoint.url, endpoint.handler);
                            break;
                        case 'post':
                            botkit.webserver.post(endpoint.url, endpoint.handler);
                            break;
                    }
                }
            }

            // register menu extensions
            if (endpoints.menu) {
                for (var e = 0; e < endpoints.menu.length; e++) {
                    var endpoint = endpoints.menu[e];
                    this.menu.add(endpoint.title, endpoint.icon, endpoint.url);
                }
            }

            if (endpoints.middleware) {
                for (var mw in endpoints.middleware) {
                    for (var e = 0; e < endpoints.middleware[mw].length; e++) {
                        botkit.middleware[mw].use(endpoints.middleware[mw][e])
                    }
                }
            }

            if (endpoints.init) {
              try {
                  endpoints.init(botkit);
              } catch(err) {
                  if (err) {
                      throw new Error(err);
                  }
              }
            }

            debug('Plugin Enabled: ', name);

        },
        web: {
            get: function(url, handler) {
                debug('Registering web handler GET ', url);
                botkit.webserver.get(url, handler);
            },
            post: function(url, handler) {
                debug('Registering web handler POST ', url);
                botkit.webserver.post(url, handler);
            }
        },
        menu: {
            add: function(title, icon, url) {
                debug('Registering menu item ', title);
                menu.push({
                    title: title,
                    icon: icon,
                    url: url,
                });
            }
        }
    }

    botkit.plugins = harness;
    botkit.use = harness.use;

}
