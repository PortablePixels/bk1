var express = require('express');
var path = require('path');
var WebSocket = require('ws');

module.exports = function(botkit) {

    var plugin = {
        name: 'Activate Botkit',
        web: [{
            url: '/',
            method: 'get',
            handler: function(req, res) {
                var relativePath = path.relative(process.cwd() + '/views', __dirname + '/views');
                res.render(relativePath + '/main');
            }
        }],
        init: function() {
          // disable skill loading
          botkit.loadSkills = function() {
            // noop
          }
          // disable plugin loading too
          botkit.use = function() {
            // noop
          }
          console.log('A Botkit token is required to launch your bot. Get one at https://studio.botkit.ai')
        }
    }

    return plugin;
}
