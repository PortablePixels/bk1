module.exports = function(botkit) {

  // botkit.hears('test','message',function(bot, message) {
  //   bot.say({text: 'I HEARD YOUR MESSAGE HUMAN.'});
  // });
  //
  // botkit.on('message', function(bot, message) {
  //   console.log('Received a message', message);
  // });
  //
  // botkit.on('hello,welcome_back', function(bot, message) {
  //   console.log('GOT A HELLO', message);
  // });


  botkit.studio.before('hello', function(convo, next) {

    console.log('BEFORE HELLO SCRIPT');

    // console.log('THROWING AN ERROR');
    // user.monkey = 1;

    next();

  });

  botkit.studio.after('hello', function(convo, next) {

    console.log('AFTER HELLO SCRIPT');

    // console.log('THROWING AN ERROR');
    // user.monkey = 1;


    next();

  });

  botkit.studio.beforeThread('hello', 'taco', function(convo, next) {
    console.log('THIS IS THE TACO THREAD');

    // console.log('THROWING AN ERROR');
    // user.monkey = 1;

    next();

  });

  botkit.studio.validate('hello', 'loves_tacos', function(convo, next) {

    console.log('VALIDATING THE TACO LOVING STATUS');

    // console.log('THROWING AN ERROR');
    // user.monkey = 1;

    next();

  });



  botkit.studio.before('test', function(convo, next) {

    if (!convo.getVar('test1')) {
      convo.setVar('test1',1);
    } else {
      convo.setVar('test1', convo.getVar('test1') + 1);
    }

    next();

  });


  botkit.studio.before('test2', function(convo, next) {

    if (!convo.getVar('test2')) {
      convo.setVar('test2',10);
    } else {
      convo.setVar('test2', convo.getVar('test2') + 1);
    }
    next();

  });

  botkit.studio.after('test', function(convo, next) {

      console.log('AFTER test');

    if (convo.successful()) {

      console.log('TEST SUCCESSFUL', convo.extractResponses());

    }
    next();

  });


  botkit.studio.after('test2', function(convo, next) {

    console.log('AFTER test2');
    console.log(convo.status);
    if (convo.successful()) {

      console.log('TEST 2 SUCCESSFUL', convo.extractResponses());

    }
    next();

  });





}
