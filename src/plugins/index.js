module.exports = {
    name: 'Simple Homepage',
    web: [
        {
            url: '/',
            method: 'get',
            handler: function(req, res) {
                res.render('home');
            }
        }
    ]
}
