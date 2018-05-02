var userModel = require('../models/user.js');

module.exports.getUserInfo = function(req, res) {
    res.json(req.body.cert);
}

// Used for getting the User's information
module.exports.registerUser = function(req, res) {

    // Checking if the user exists in the database
    var checkUser = userModel.count({ 'sid': req.body.cert.CN }).exec();

    checkUser.then(function(count) {
        if (count < 1) {

            var newUser = new userModel({
                sid: req.body.cert.CN,
                email: req.body.cert.emailAddress
            });

            var saveUser = user.save();

            saveUser.then(function(user) {

            });

        } else if (count > 0) {
            res.redirect('/');
        }
    }).catch(function(error) {
        throw error;
    });

}