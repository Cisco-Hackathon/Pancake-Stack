var userModel = require('../models/user.js'),
    shajs = require('sha.js'),
    assert = require('assert'),
    request = require('request');

module.exports.home = function(req, res) {
    res.render('index');
}

// Used to register the User
module.exports.register = function(req, res) {

    // Checking if the user exists
    if (userExists(req.body.user.sid)) {
        // Saving the user into the database
        saveUserIntoLocalDB(req.body.cert)
        .then(function(user) {
            // Register the user with Portainer
            return saveUserInPortainer(user);
        })
        .then(function(body) {
            // When user has been created locally and on Portainer, redirect to Dashboard
            res.redirect('/dashboard');
        }).catch(function(error) {
            // Catching errors
            assert.ifError(error);
        });

    } else {
        res.redirect('/dashboard');
    }

    // @Returns Promise | Stores the user into the Local database
    function saveUserIntoLocalDB(certInfo) {
        // Creating a new user object based on the info from the browser certificate
        var newUser = new userModel({
            sid: certInfo.CN,
            email: certInfo.emailAddress
        });
        // Return the query promise
        return newUser.save();
    }

    // @Returns Boolean | Checks to see if user exists in database
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

    // @Returns Promise | Create a user on the Portainer API
    function saveUserInPortainer(userObj) {
        // Creating a password for the user by taking a SHA256 of the user's profile
        var password = shajs('sha256').update(userObj).digest('hex');
        // Returning the promise
        return new Promise(function(resolve, reject) {
            // Sending the request to the Portainer API
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

// Used to render the Dashboard page
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