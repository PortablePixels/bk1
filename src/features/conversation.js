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
        if (!this.state.vars) {
            this.state.vars = {};
        }
        if (!this.state.user_vars) {
            this.state.user_vars = {};
        }

        this.events = {};


        // the source script
        this.script = {}

        // a named map of threads
        this.threads = {};

        this.replies = [];

        // a function to back-translate version 2 scripts to version 1
        this.transformVersion2to1 = function(script) {

            function transformMessage(message) {

                if (message.capture_input) {
                    message.collect = {
                        key: message.key,
                        options: message.branches ? message.branches.map(function(b) {

                            return b;
                            // var option = {
                            //   pattern: b.pattern,
                            //   type: b.type,
                            //   action: b.action,
                            //   options: b.options,
                            // }
                            //
                            // return option;
                        }) : null,
                    }

                    message.quick_replies = message.branches ? message.branches.filter(function(b) {
                        return b.quick_reply;
                    }).map(function(b) {
                        return {
                            title: b.quick_reply_title,
                            payload: b.pattern
                        }
                    }) : null;

                    delete(message.capture_input);
                    delete(message.branches);
                    delete(message.key);
                }

                return message;

            }

            function transformThread(thread) {
                return {
                    topic: thread.topic,
                    script: thread.messages.map(transformMessage)
                }
            }

            var version1 = {
                command: script.command,
                created: script.created,
                modified: script.modified,
                script: script.threads.map(transformThread),
            }

            return version1;

        }




        this.on = function(event, cb) {
            var events = (typeof(event) == 'string') ? event.split(/\,/g) : event;
            for (var e in events) {
                if (!this.events[events[e]]) {
                    this.events[events[e]] = [];
                }
                this.events[events[e]].push({
                    callback: cb,
                });
            }
            return this;
        };

        this.trigger = function(event, data) {
            if (this.events[event]) {
                var handlers = this.events[event];
                if (handlers.length) {
                    for (var e = 0; e < handlers.length; e++) {
                        var res = handlers[e].callback.apply(this, data);
                        if (res === false) {
                            return;
                        }
                    }
                }
            }
        };


        this.ready = function() {
            var that = this;
            if (that.state.ready !== true) {
                that.state.ready = true;
                that.trigger('ready');
            }
        }

        this.onready = function() {
            var that = this;
            return new Promise(function(resolve, reject) {
                if (that.state.ready) {
                    resolve();
                } else {
                    that.on('ready', function() {
                        resolve();
                    });
                }
            });
        }

        this.ingestScript = function(script) {
            var that = this;

            that.state.ready = false;

            return new Promise(function(resolve, reject) {

                // TODO: Eventually this will switch and we will process v2 scripts by default
                if (script.version == 2) {
                    that.script = that.transformVersion2to1(script);
                } else {
                    that.script = script;
                }

                // generate message ids for every message
                that.script.script.map(function(thread) {
                  for (var m = 0; m < thread.script.length; m++) {
                    thread.script[m].$mid = that.script.command + '-' + thread.topic + '-' + m;
                  }
                })

                for (var x = 0; x < that.script.script.length; x++) {
                    that.threads[that.script.script[x].topic] = that.script.script[x].script;
                }

                botkit.storeConversationState(that).then(function() {
                    that.ready();
                    resolve()
                }).catch(reject);
            });

        }

        this.setUser = function(uid) {
            this.context.user = uid;
        }

        this.setChannel = function(channel) {
            this.context.channel = channel;
        }


        this.setVar = function(key, val) {
          if (val) {
            if (val.trim) {
              this.state.vars[key] = val.trim();
            } else {
              this.state.vars[key] = val;
            }
          } else {
            delete(this.state.vars[key]);
          }
        }

        this.getVar = function(key) {
            if (typeof(this.state.vars[key]) == 'undefined') {
                return false;
            } else {
                return this.state.vars[key];
            }
        }


        this.setUserVar = function(key, val) {
            if (!this.state.user_vars) {
                this.state.user_vars = {};
            }
            if (val) {
              if (val.trim) {
                this.state.user_vars[key] = val.trim();
              } else {
                this.state.user_vars[key] = val;
              }
            } else {
              delete(this.state.user_vars[key]);
            }
        }


        this.extractResponse = function(key) {
            if (!this.state || !this.state.vars) {
                return '';
            }
            return this.state.user_vars ? (this.state.user_vars[key] ? this.state.user_vars[key] : '') : '';
        }

        this.extractResponses = function() {
            return this.state.user_vars ? this.state.user_vars : {};
        }

        this.kickoff = function(force) {
            var that = this;

            debug('Kickoff script', that.script.command, that.state);
            return new Promise(function(resolve, reject) {
                that.onready().then(function() {
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
                }).catch(reject);
            });
        }


        this.processTemplate = function(obj) {

            var vars = {
                vars: this.state.vars,
                user: this.state.user_vars,
                state: this.state,
            }

            if (typeof(obj) == 'string') {
                var rendered;
                try {
                    rendered = mustache.render(obj, vars);
                } catch (err) {
                    console.error(err);
                    rendered = obj;
                };
                return rendered;

            } else if (typeof(obj) == 'object') {
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
                        var reply = next_messages[m];

                        // make sure this is properly addressed
                        reply.channel = that.context.channel;
                        reply.user = that.context.user;

                        //                      var reply = that.processTemplate(template);
                        reply.to = that.context.user;

                        // generate a message id that identifies this message
                        // TODO: make sure this field name doesn't cause issues.
                        // TODO: consider: $fields get pruned before sending?
                        // reply.$mid = that.script.command + '-' + that.state.thread + '-' + that.state.cursor;

                        // send only if it has some real payload
                        // TODO: there should be a better way to indicate messages not to send
                        if (reply.text || reply.quick_replies || reply.platforms || reply.attachments || reply.attachment) {
                            q.add(that.context.user, reply);
                        }
                    }

                    // tell the queue how to process messages in this queue
                    q.work(that.context.user, function(reply, next) {
                        // todo: it would be better to spawn a new bot to send this
                        // but right now that might not be possible because of sockets?
                        bot.say(reply).then(function() {
                            next();
                        }).catch(function(err) {
                            console.error('Error sending message', err);
                            // TODO: Retry!!!-- shouild probably be implemented inside platform adapters
                            next();
                        });
                    }, {
                        maxWorkers: 1
                    });
                }).catch(function(err) {
                    console.error('ERROR FULFILLING', err);
                });
            }).catch(function(err) {
                console.error('ERROR FULFILLING', err);
            })
        }



        this.walkScript = function() {
                var that = this;
                that.state.turn++;

                debug('Walk script', that.script.command, that.state);

                return new Promise(function(resolve, reject) {

                    that.captureResponse().then(function() {

                        var thread = that.threads[that.state.thread];

                        // empty thread, all done
                        if (!thread) {
                            return resolve([]);
                        }

                        if (that.status == 'active' && that.state.cursor < thread.length) {
                            var reply = clone(thread[that.state.cursor]);

                            that.state.cursor++;
                            that.replies.push(that.processTemplate(reply));
                            // pause for response
                            if (reply.collect || (reply.quick_replies && reply.quick_replies.length > 0)) {
                                botkit.storeConversationState(that).then(function() {
                                    resolve(that.replies);
                                });
                            } else if (reply.action) {
                                // take an action baby
                                if (reply.condition) {
                                    botkit.testCondition(that.processTemplate(clone(reply.condition))).then(function(passed) {
                                        if (passed) {
                                            that.takeAction(reply).then(function() {
                                                that.walkScript().then(resolve).catch(reject);
                                            }).catch(reject);
                                        } else {
                                            that.walkScript().then(resolve).catch(reject);
                                        }
                                    }).catch(reject);
                                } else {
                                    that.takeAction(reply).then(function() {
                                        that.walkScript().then(resolve).catch(reject);
                                    }).catch(reject);
                                }
                            } else {
                                that.walkScript().then(resolve).catch(reject);
                            }
                            // }
                        } else {
                            botkit.middleware.afterScript.run(that, function(err, that) {
                                if (err) {
                                    reject(err);
                                } else {
                                    botkit.endSession(that).then(function() {
                                        resolve(that.replies);
                                    }).catch(function(err) {
                                        reject(err);
                                    })
                                }
                            });
                        }

                    }).catch(reject);

                })
            },



            this.gotoThread = function(new_thread) {
                var that = this;
                return new Promise(function(resolve, reject) {
                    debug('gotoThread', new_thread);
                    var current_thread = that.state.thread;

                    that.state.cursor = 0;
                    that.state.thread = new_thread;

                    botkit.middleware.beforeThread.run(that, new_thread, function(err, that, new_thread) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }

        this.repeat = function() {
            this.state.cursor--;
        }

        this.stop = function(status) {
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
                debug('SWITCHING SCRIPT FROM ', that.script.command, 'TO', options.script);
                botkit.api.getScript(options.script, that.context.user).then(function(script) {
                    botkit.middleware.afterScript.run(that, function(err, that) {


                        if (err) {

                            console.error('Could not run afterScript', err);
                            reject(err);

                        }  else {
                          
                            that.state.transition_from = that.script.command;

                            // reset script and state
                            that.state.cursor = 0;
                            that.state.thread = 'default';
                            that.ingestScript(script).then(function() {
                                if (options.thread && options.thread != 'default') {
                                    that.kickoff(true).then(function() {
                                        that.gotoThread(options.thread).then(resolve).catch(reject)
                                    }).catch(reject);
                                } else {
                                    // call any before things
                                    that.kickoff(true).then(resolve).catch(reject);
                                }
                            }).catch(function(err) {

                                console.error('Injesting Script Failed', err);
                                reject(err);

                            });

                        }
                    });

                }).catch(function(err) {

                    console.error('getScript Failed', err);
                    reject(err);
                                
                });
            })
        }

        this.takeAction = function(message) {
            var that = this;
            return new Promise(function(resolve, reject) {
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

                        // TODO: this should be part of the external triggers feature
                    case 'execute_script':
                        that.executeScript(message.execute).then(resolve).catch(reject);
                        break;
                    default:
                        if (botkit.hasPluginAction(message.action)) {
                            botkit.handlePluginAction(message.action, that, message).then(resolve).catch(reject);
                        } else {
                            that.gotoThread(message.action).then(resolve).catch(reject);
                        }
                }
            });
        }

        // this.createThread = function(thread_name) {
        //
        //   var that = this;
        //   // remove this thread if it exists already
        //   that.script.script = that.script.script.filter(function(t) {
        //       return (t.topic != thread_name);
        //   });
        //
        //   that.script.script.push({
        //     topic: thread_name,
        //     script: [],
        //   });
        //
        // }
        //
        // this.addMessageToThread = function(message, thread_name) {
        //     var that = this;
        //     for (var x = 0; x < that.script.script.length; x++) {
        //       if (that.script.script[x].topic == thread_name) {
        //         that.script.script[x].script.push(message);
        //       }
        //     }
        // }


        this.captureResponse = function() {
            var that = this;

            return new Promise(function(resolve, reject) {

                var thread = that.threads[that.state.thread];

                // this was the answer to a question
                if (that.state.cursor > 0 && thread[that.state.cursor - 1].collect) {
                    var condition = thread[that.state.cursor - 1].collect;

                    that.setUserVar(condition.key, that.context.incoming_message.text);

                    botkit.middleware.onChange.run(that, condition.key, that.context.incoming_message.text, function(err, that, key, val) {
                        if (err) {
                            reject(err);
                        } else {
                            if (condition.options) {
                                var default_action = condition.options.filter(function(c) {
                                    return c.default == true;
                                });
                                var possible_actions = condition.options.filter(function(c) {
                                    return c.default != true;
                                });

                                // test all the patterns
                                var triggered = 0;
                                async.eachSeries(possible_actions, function(pattern, next) {
                                    async.eachSeries(botkit.ears, function(test, next_test) {
                                        if (triggered == 0) {
                                            test(pattern, that.context.incoming_message).then(function(match) {
                                                if (match) {
                                                    triggered++;
                                                    that.takeAction(pattern).then(function() {
                                                        next_test();
                                                    }).catch(next_test);
                                                } else {
                                                    next_test();
                                                }
                                            })
                                        } else {
                                            next_test();
                                        }
                                    }, function(err) {
                                        next(err);
                                    });
                                }, function() {
                                    if (triggered == 0 && default_action.length) {
                                        that.takeAction(default_action[0]).then(function() {
                                            resolve();
                                        }).catch(reject);
                                    } else {
                                        resolve();
                                    }
                                });
                            } else {
                                resolve();
                            }
                        }
                    });
                } else {
                    resolve();
                }
            })
        }



        this.setUser(message.user);
        this.setChannel(message.channel);
        this.ingestScript(script).catch(function(err) {
            console.error('Error creating conversation', err);
            throw new Error(err);
        });

        return this;

    }


    botkit.createConversation = function(message, bot, state, script) {
        return new Conversation(message, bot, state, script);
    }


}
