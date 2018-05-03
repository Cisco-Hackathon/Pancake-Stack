var shajs = require('sha.js'),
    assert = require('assert'),
    request = require('request'),
    user = require('../models/user.js'),
    machine = require('../models/machine.js');
    machineType = require('../models/machine_types.js');

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

// Used to get all of the machines for the user
module.exports.getMachines = function(req, res) {

    var getMachines = machine.find({ 'machineOwner': req.body.cert.CN }).exec();

    getMachines.then(function(machines) {
        res.json(machines);
    }).catch(function(error) {
        assert.ifError(error);
    });

}

// Used to provision a new machine
module.exports.newMachine = function(req, res) {

    var machineInfo = req.body.machineData;

    // Used to spin up a new Portainer container
    var createNewPortainerInstance = function(machineInfo, userToken) {
        return new Promise(function(resolve, reject) {
            request.post({
                url: "http://52.209.115.148:9000/api/endpoints/1/docker/containers/create",
                headers: {
                    Authorization: 'Bearer ' + userToken
                },
                json: {
                    "name": machineInfo.name,
                    "image": machineInfo.base.buildId
                }
            }, function(error, httpResponse, body) {

                console.log(body);

                if (error) reject(error);

                if (httpResponse.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(body);
                }
            });
        });
    }

    // Basic validation
    if (machineInfo.name.length > 1) {

        var createNewMachine = createNewPortainerInstance(machineInfo, req.body.authToken);

        createNewMachine.then(function(buildInfo) {
            res.json(buildInfo);
        }).catch(function(err) {
            assert.ifError(err);
        });

    } else {
        res.json({
            success: false,
            message: "You must provide a machine name"
        });
    }

}

// Used to get a list of available machines
module.exports.getMachineTypes = function(req, res) {

    var getMachineType = machineType.find({}).exec();

    getMachineType.then(function(machines) {
        res.json(machines);
    }).catch(function(error) {
        assert.ifError(error);
    });

}