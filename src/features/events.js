var debug = require('debug')('botkit:events');

module.exports = function(botkit) {

  botkit.events = {};


  botkit.on = function(event, cb) {
        debug('Setting up a handler for', event);
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

    botkit.trigger = function(event, data) {
        if (this.events[event]) {

            var handlers = this.events[event];

            if (handlers.length) {
                // botkit.middleware.triggered.run(data[0], data[1], function(err, bot, message) {
                    for (var e = 0; e < handlers.length; e++) {
                        var res = handlers[e].callback.apply(this, data);
                        if (res === false) {
                            return;
                        }
                    }
                // });
            }
        }
    };

}
