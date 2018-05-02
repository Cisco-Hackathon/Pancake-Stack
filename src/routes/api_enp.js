var shajs = require('sha.js'),
    assert = require('assert'),
    request = require('request'),
    user = require('../models/user.js');

module.exports.authUser = function(req, res) {

    // Used to get the user from the database
    var findUser = user.find({ 'sid': req.body.cert.CN }).exec();

    // Waiting for the data to return
    findUser.then(function(user) {
        if (user) {

            var getToken = getUserToken(user);

            getToken.then(function(token) {
                res.json(token);
            }).catch(function(error) {
                assert.ifError(error);
            });

        } else {
            res.sendStatus(403);
        }
    }).catch(function(error) {
        assert.ifError(error);
    });

    // Used to get a token from the Portainer API
    var getUserToken = function(user) {

        // Getting the username and password
        var username = user[0].sid,
            password = shajs('sha256').update(user[0]).digest('hex');

        return new Promise(function(resolve, reject) {
            request.post({
                url: 'http://52.209.115.148:9000/api/auth',
                json: {
                    "Username": username,
                    "Password": password
                }
            }, function(error, httpResponse, body) {

                if (error) reject(error);

                if (httpResponse.statusCode == 200) {
                    var token = body.jwt;
                    if (token) {
                        resolve(token);
                    }
                } else {
                    reject(body);
                }

            });
        });
    }

}