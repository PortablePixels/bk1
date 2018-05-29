var express = require('express');
var path = require('path');

var user_schema = {
    id: {
        type: String,
        index: true,
    },
    platform: {
      type: String,
    },
    facts: {
        type: Object,
    },
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
            name: 'Database of Humans',
            web: [{
                url: '/admin/humans',
                method: 'get',
                handler: function(req, res) {
                    var relativePath = path.relative(process.cwd() + '/views', __dirname + '/views');
                    res.render(relativePath + '/list');
                }
            },
            {
                url: '/admin/humans/:uid',
                method: 'get',
                handler: function(req, res) {
                    var relativePath = path.relative(process.cwd() + '/views', __dirname + '/views');
                    res.render(relativePath + '/detail');
                }
            },
            {
                url: '/admin/api/humans',
                method: 'get',
                handler: function(req, res) {
                    var query = botkit.db.humans.find({}).sort({created: -1});
                    query.exec(function(err, humans) {
                        res.json(humans);
                    });
                }
            },
            {
                url: '/admin/api/humans/:uid',
                method: 'get',
                handler: function(req, res) {
                    var query = botkit.db.humans.findOne({id: req.params.uid});
                    query.exec(function(err, human) {
                        res.json(human);
                    });
                }
            }
            ],
            menu: [
                {
                  title: 'Humans',
                  url: '/admin/humans',
                  icon: '😄',
                }
            ],

            middleware: {
                beforeScript: [function(convo, next) {
                    botkit.db.humans.findOne({
                        id: convo.context.user
                    },function(err, human) {
                        if (err) {
                            next(err);
                        } else {
                            if (human) {
                                for (var key in human.facts) {
                                    convo.setUserVar(key,human.facts[key]);
                                }
                            }
                            next();
                        }
                    });
                }],
                onChange: [function(convo, key, val, next) {
                    var facts = convo.extractResponses();
                    var human = {
                        id: convo.context.user,
                        facts: facts,
                        platform: convo.bot.type,
                        modified: new Date(),
                    };

                    // TODO: could be a more efficient db query here
                    botkit.db.humans.findOneAndUpdate({
                        id: convo.context.user
                    },human, {
                        upsert: true,
                        setDefaultsOnInsert: true
                    }, function(err) {
                        if (err) {
                            next(err);
                        } else {
                            next();
                        }
                    });
                }]
            },
            init: function(botkit) {
                botkit.db.addModel(user_schema,'human','humans');
                botkit.webserver.use("/plugins/humans", express.static(__dirname + "/public"));

            }
        }
    }
