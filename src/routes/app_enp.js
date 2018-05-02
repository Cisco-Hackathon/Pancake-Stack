var userModel = require('../models/user.js'),
    shajs = require('sha.js'),
    assert = require('assert'),
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

                var portainerRegister = registerPortainerUser(user);

                portainerRegister.then(function(body) {
                    res.json(body);
                });

                portainerRegister.catch(function(error) {
                    assert.ifError(error);
                });


            });

            saveUser.catch(function(error) {
                assert.ifError(error);
            });

        } else if (count > 0) {
            res.redirect('/');
        }
    }).catch(function(error) {
        assert.ifError(error);
    });

    var registerPortainerUser = function(userObj) {

        var password = shajs('sha256').update(userObj).digest('hex');

        return new Promise(function(resolve, reject) {
            request.post({
                url: 'http://52.209.115.148:9000/api/users',
                headers: {
                    Authorization: 'Bearer ' + process.env.PORTAINER_AUTH_TOKEN
                },
                json: {
                    "Username": userObj.sid,
                    "Password": password,
                    "Role": 2
                }
            }, function(error, httpResponse, body) {
                if (error) reject(error);

                if (httpResponse.statusCode == 200) {
                    var token = process.env.PORTAINER_AUTH_TOKEN = body.jwt;
                    if (token) {
                        resolve();
                    }
                } else {
                    reject(body);
                }
            });
        });

    }

}

module.exports.dashboard = function(req, res) {


}