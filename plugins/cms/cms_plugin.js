var express = require('express');
var path = require('path');
var debug = require('debug')('botkit:cms');
const CURRENT_SCRIPT_VERSION = 2;

var script_schema = {
    version: String,
    command: String,
    threads: [{}],
    created: {
        type: Date,
        default: Date.now,
    },
    modified: {
        type: Date,
        default: Date.now,
    },
}

module.exports = function(botkit) {
        return {
            name: 'Dialog Manager',
            web: [{
                url: '/admin/cms',
                method: 'get',
                handler: function(req, res) {
                    var relativePath = path.relative(process.cwd() + '/views', __dirname + '/views');
                    res.render(relativePath + '/list');
                }
            },
            {
                url: '/admin/cms/:script',
                method: 'get',
                handler: function(req, res) {
                    var relativePath = path.relative(process.cwd() + '/views', __dirname + '/views');
                    res.render(relativePath + '/detail');
                }
            },
            {
                url: '/admin/api/scripts',
                method: 'get',
                handler: function(req, res) {
                    var query = botkit.db.scripts.find({}).sort({modified: -1});
                    query.exec(function(err, humans) {
                        res.json(humans);
                    });
                }
            },
            {
                url: '/admin/api/scripts/:id',
                method: 'get',
                handler: function(req, res) {
                    var query = botkit.db.scripts.findOne({_id: req.params.id});
                    query.exec(function(err, human) {
                        res.json(human);
                    });
                }
            },
            {
                url: '/admin/api/scripts/:id',
                method: 'post',
                handler: function(req, res) {
                  var script = req.body;
                  var query = botkit.db.scripts.update({_id: script._id}, {
                    $set: {
                      command: script.command,
                      threads: script.threads,
                      modifed: new Date(),
                    }
                  });

                  query.exec(function(err) {
                    res.json(script);
                  })

                }
            },
            {
                url: '/admin/api/scripts',
                method: 'post',
                handler: function(req, res) {

                    var new_script = req.body;

                    var script = new botkit.db.scripts();
                    script.command = new_script.command;
                    script.version = new_script.version || CURRENT_SCRIPT_VERSION;
                    script.threads = new_script.threads;

                    script.save(function(err, script) {
                      res.json(script);
                    });

                    console.log('NEW SCRIPT', new_script);
                    // var query = botkit.db.scripts.findOne({id: req.params.id});
                    // query.exec(function(err, human) {
                    //     res.json(human);
                    // });
                }
            }
            ],
            menu: [
                {
                  title: 'Dialogs',
                  url: '/admin/cms',
                  icon: '📚',
                }
            ],
            middleware: {
                understand: [function(bot, message, response, next) {
                    debug('Evaluate ', message);
                    if (response.script) {
                        debug('Skipping db triggers');
                        return next();
                    }

                    // TODO: can do this with some more sublety
                    botkit.db.scripts.find({}, function(err, scripts) {

                        if (err) {
                            console.log('Error loading scripts', err);
                            return next(err);
                        }

                        // TODO: this is fake
                        // need to compile triggers and test them all

                        for (var s = 0; s < scripts.length; s++) {
                            if (message.text == scripts[s].command) {
                                debug('MATCHED A TRIGGER');
                                response.script = scripts[s];
                                response.state = {
                                    thread: 'default',
                                    cursor: 0,
                                    turn: 0,
                                }
                            }
                        }

                        next();
                    });
                }],
            },
            init: function(botkit) {
                botkit.db.addModel(script_schema,'script','scripts');
                botkit.webserver.use("/plugins/cms", express.static(__dirname + "/public"));
            }
        }
    }
