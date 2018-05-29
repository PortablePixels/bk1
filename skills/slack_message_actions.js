module.exports = function(controller) {


    controller.on('message_action', function(bot, message) {
        console.log('ACTION', message);


    });

}
