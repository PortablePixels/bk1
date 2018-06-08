module.exports = function(botkit) {
  botkit.actions = [];

  botkit.addAction = function(type, description, template, handler) {
    botkit.actions.push({
      type: type,
      description: description,
      template: template,
      handler: handler
    });
  }

  // has a plugin registered to handle this action type?
  botkit.hasPluginAction = function(type) {
    return (botkit.actions.filter(function(a) { return a.type == type }).length > 0);
  }


  // call the action!
  botkit.handlePluginAction = function(type, convo, message) {
    return new Promise(function(resolve, reject) {
      var actions = botkit.actions.filter(function(a) { return a.type == type });
      if (actions.length) {
          actions[0].handler(convo, message).then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
  }


}
