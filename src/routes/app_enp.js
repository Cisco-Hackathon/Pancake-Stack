var userModel = require('../models/user.js'),
    shajs = require('sha.js'),
    assert = require('assert'),
    request = require('request');

module.exports.home = function(req, res) {
    res.render('index');
}

module.exports.register = function(req, res) {


    if (userExists(req.body.user.sid)) {

        var newUser = new userModel({
            sid: req.body.cert.CN,
            email: req.body.cert.emailAddress
        });

        var saveUser = newUser.save();

        saveUser.then(function(user) {

            var portainerRegister = registerPortainerUser(user);

            portainerRegister.then(function(body) {
                res.redirect('/dashboard');
            });

            portainerRegister.catch(function(error) {
                assert.ifError(error);
            });


        });

        saveUser.catch(function(error) {
            assert.ifError(error);
        });

    } else {
        res.redirect('/dashboard');
    }


    // @Return Boolean | Checks to see if user exists in database
    function userExists(userSid) {
        // Counting the amount of users with the provided ID in the database
        var getUserCount = userModel.count({ 'sid': req.body.cert.CN }).exec();
        // Waiting for request to complete
        getUserCount.then(function(count) {
            if (count > 0) { // User already exists
                return true;
            } else if (count < 1) { // User does not exist
                return false;
            }
        });
        // Catching errors
        getUserCount.catch(function(error) {
            assert.ifError(error);
        });
    }

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

    // Checking if the user has registered
    var findUser = userModel.count({ 'sid': req.body.cert.CN }).exec();

    // Checking if they're registered
    findUser.then(function(count) {

        if (count > 0) { // User is already registered
            res.render('dashboard');
        } else {
            res.redirect('/register');
        }
    }).catch(function(error) {
        assert.ifError(error);
    });

}