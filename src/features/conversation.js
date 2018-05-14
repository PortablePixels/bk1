var debug = require('debug')('botkit:conversation');
var async = require('async');
var clone = require('clone');
var mustache = require('mustache');
var q = require('ezq');
q.use(q.memory);

module.exports = function(botkit) {

    function Conversation(message, bot, state, script) {

        // capture information about what this conversation is about
        this.context = {
            incoming_message: message,
            user: null,
            channel: null,
        }

        this.status = 'active';

        this.bot = bot;

        this.state = state;

        this.script = script;

        this.replies = [];

        this.setUser = function(uid) {
            this.context.user = uid;
        }

        this.setChannel = function(channel) {
            this.context.channel = channel;
        }

        this.setVar = function(key, val) {
          if (key!='user') {
            this.state.vars[key] = val;
          }
        }

        this.getVar = function(key) {
          if (typeof(this.state.vars[key])=='undefined') {
            return false;
          } else {
            return this.state.vars[key];
          }
        }


        this.setUserVar = function(key, val) {
          if (!this.state.vars['user']) {
            this.state.vars['user'] = {};
          }
          this.state.vars['user'][key] = val;
        }


        this.extractResponse = function(key) {
          if (!this.state || !this.state.vars) {
            return '';
          }
          return this.state.vars['user'] ? this.state.vars['user'][key] : '';
        }

        this.extractResponses = function() {

          return this.state.vars['user'] ? this.state.vars['user'] : {};
        }

        this.kickoff = function(force) {
            var that = this;
            return new Promise(function(resolve, reject) {
                if (force || that.state.turn === 0) {
                    botkit.middleware.beforeScript.run(that, function(err, that) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
        }

        this.updateSession = function() {
            var that = this;
            return new Promise(function(resolve, reject) {

                botkit.db.sessions.findOneAndUpdate({
                    user: that.context.user,
                    channel: that.context.channel,
                }, {
                    user: that.context.user,
                    channel: that.context.channel,
                    state: that.state,
                    script: that.script,
                }, {upsert: true}, function(err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }

                });
            });
        }

        this.processTemplate = function(obj) {

          var vars = {
            vars: this.state.vars,
            user: this.state.vars.user,
          }

          if (typeof(obj)=='string') {
            var rendered;
            try {
                 rendered = mustache.render(obj, vars);
             } catch (err) {
                 console.error(err);
                 rendered = obj;
             };
             return rendered;

          } else if (typeof(obj)=='object') {
            for (key in obj) {
              obj[key] = this.processTemplate(obj[key]);
            }
            return obj;
          } else {
            return obj;
          }

        }

        this.fulfill = function() {
            var that = this;
            debug('FULFILL', this.context.incoming_message);

            // run any before scripts
            that.kickoff().then(function() {

                // walk the script from the current cursor position all the way through any middlewares, until a branch point or the end is reached
                that.walkScript().then(function(next_messages) {

                  // queue up all the replies to be sent
                  for (var m = 0; m < next_messages.length; m++) {
                      var template = next_messages[m];

                      // make sure this is properly addressed
                      template.channel = that.context.channel;
                      template.user = that.context.user;

                      var reply = that.processTemplate(template);
                      q.add(that.context.user, reply);

                  }

                  // tell the queue how to process messages in this queue
                  q.work(that.context.user, function(reply, next) {

                      // todo: it would be better to spawn a new bot to send this
                      // but right now that might not be possible because of sockets?
                      bot.say(reply).then(function() {
                          next();
                      });
                  }, {
                      maxWorkers: 1
                  });
                });
            }).catch(function(err) {
              console.error('ERROR FULFILLING', err);
            })
        }

        this.setUser(message.user);
        this.setChannel(message.channel);


        this.walkScript = function() {
                var that = this;
                that.state.turn++;

                return new Promise(function(resolve, reject) {

                    that.captureResponse().then(function() {

                        var thread = that.script.script.filter(function(t) {
                            return (t.topic == that.state.thread);
                        });

                        thread = thread[0];

                        if (that.status=='active' && that.state.cursor < thread.script.length) {
                            var reply = thread.script[that.state.cursor];

                            // console.log('logging next reply', reply);
                            that.state.cursor++;
                            that.replies.push(reply);
                            // pause for response
                            if (reply.collect) {
                                that.updateSession(that.context, that.state).then(function() {
                                  resolve(that.replies);
                                });
                            } else if (reply.action) {
                                // take an action baby
                                // console.log('MESSAGE ACTION', reply.action);
                                that.takeAction(reply).then(function() {
                                    that.walkScript().then(resolve).catch(reject);
                                }).catch(reject);
                            } else {
                                that.walkScript().then(resolve).catch(reject);
                            }
                            // }
                        } else {
                            botkit.middleware.afterScript.run(that, function(err, that) {
                                botkit.db.sessions.remove({
                                    user: that.context.user,
                                    channel: that.context.channel
                                }, function(err) {
                                    if (err) {
                                        console.error('Could not remove session', err);
                                    }
                                    resolve(that.replies);
                                });
                            });
                        }

                    });

                })
            },



            this.gotoThread = function(new_thread) {
                var that = this;
                return new Promise(function(resolve, reject) {
                    debug('gotoThread', new_thread);
                    botkit.middleware.beforeThread.run(that, new_thread, function(err, that, new_thread) {
                        // console.log('Go to thread ', new_thread);
                        that.state.cursor = 0;
                        that.state.thread = new_thread;
                        resolve();
                    });
                });
            }

        this.repeat = function() {
            this.state.cursor--;
        }

        this.stop = function(status) {
            // console.log('REACH END!', status);
            this.status = status || 'stopped';
        }

        this.active = function() {
          return this.status == 'active';
        }

        this.successful = function() {
          return this.status == 'completed';
        }

        this.executeScript = function(options) {
            var that = this;
            return new Promise(function(resolve, reject) {
                debug('SWITCHING SCRIPT FROM ', that.script.command,'TO',options.script);
                botkit.api.getScript(options.script, that.context.user).then(function(script) {

                      botkit.middleware.afterScript.run(that, function(err, that) {

                      // reset script and state
                      that.state.cursor = 0;
                      that.state.thread = 'default';
                      that.script = script;

                      if (options.thead) {
                        that.kickoff(true).then(function() { that.gotoThread(options.thread).then(resolve).catch(reject) }).catch(reject);
                      } else {
                        // call any before things
                        that.kickoff(true).then(resolve).catch(reject);
                      }
                    });

                }).catch(reject);
            })
        }

        this.takeAction = function(message) {
            var that = this;
            return new Promise(function(resolve, reject) {
                // console.log('* TAKE AN ACTION', message.action);
                switch (message.action) {
                    case 'repeat':
                        that.repeat();
                        resolve();
                        break;
                    case 'stop':
                        that.stop('stopped');
                        resolve();
                        break;
                    case 'complete':
                        that.stop('completed');
                        resolve();
                        break;
                    case 'next':
                        // response.state.cursor++;
                        resolve();
                        break;
                    case 'wait':
                        // that.silentRepeat();
                        // TODO: figure out necessary action
                        break;
                    case 'timeout':
                        that.stop('timeout');
                        resolve();
                        break;
                    case 'execute_script':
                        // console.log('EXECUTE SCRIPT',message);
                        that.executeScript(message.execute).then(resolve).catch(reject);
                        break;
                    default:
                        that.gotoThread(message.action).then(function() {
                            resolve();
                        });
                }
            });
        }



        this.captureResponse = function() {
            var that = this;

            return new Promise(function(resolve, reject) {

                var thread = that.script.script.filter(function(t) {
                    return (t.topic == that.state.thread);
                });

                thread = thread[0];


                // this was the answer to a question
                if (that.state.cursor > 0 && thread.script[that.state.cursor - 1].collect) {
                    var condition = thread.script[that.state.cursor - 1].collect;

                    // console.log('SET RESPONSE:', thread.script[response.state.cursor - 1].collect.key, message.text);
                    //that.state.vars[condition.key] = that.context.incoming_message.text;
                    that.setUserVar(condition.key, that.context.incoming_message.text);

                    botkit.middleware.onChange.run(that, condition.key, that.context.incoming_message.text, function(err, that, key, val) {
                        if (condition.options) {
                            // console.log('options', condition.options);
                            var default_action = condition.options.filter(function(c) {
                                return c.default == true;
                            });
                            var possible_actions = condition.options.filter(function(c) {
                                return c.default != true;
                            });

                            // test all the patterns
                            var triggered = 0;
                            async.each(possible_actions, function(pattern, next) {
                                // console.log('POSSIBLE ACTION', pattern.action);
                                var test = new RegExp(pattern.pattern, 'i');
                                if (triggered == 0 && that.context.incoming_message.text.match(test)) {
                                    console.log('💡 > ', that.context.incoming_message.text, '==', pattern.pattern,pattern.action);
                                    triggered++;
                                    that.takeAction(pattern).then(function() {
                                        next();
                                    });
                                } else {
                                    next();
                                }
                            }, function() {
                                if (triggered == 0 && default_action.length) {
                                    // console.log('💡 > TOOK DEFAULT ACTION');
                                    that.takeAction(default_action[0]).then(function() {
                                        // console.log('took default action....')
                                        resolve();
                                    });
                                } else {
                                    resolve();
                                }
                            });

                        } else {
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            })
        }

        return this;

    }


    botkit.createConversation = function(message, bot, state, script) {
        return new Conversation(message, bot, state, script);
    }


}
