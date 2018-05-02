var userModel = require('../models/user.js'),
    request = require('request');

module.exports.home = function(req, res) {
    res.render('index');
}

module.exports.register = function(req, res) {

    // Checking if the user exists in the database
    var checkUser = userModel.count({ 'sid': req.body.cert.CN }).exec();

    checkUser.then(function(count) {
        if (count < 1) {

            var newUser = new userModel({
                sid: req.body.cert.CN,
                email: req.body.cert.emailAddress
            });

            var saveUser = newUser.save();

            saveUser.then(function(user) {
                res.json(user);
            });

            saveUser.catch(function(error) {
                throw error;
            });

        } else if (count > 0) {
            res.redirect('/');
        }
    });

    checkUser.catch(function(error) {
        throw error;
    });

    var registerPortainerUser = function(userObj) {
        return new Promise(function(resolve, reject) {
            request.post({
                url: 'http://52.209.115.148:9000/api/users',
                body: {
                    'Username': userObj.sid,
                    'Password':
                }
            });
        });
    }

}

module.exports.dashboard = function(req, res) {


}