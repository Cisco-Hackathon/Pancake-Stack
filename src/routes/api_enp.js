var shajs = require('sha.js'),
    assert = require('assert'),
    request = require('request'),
    user = require('../models/user.js'),
    machine = require('../models/machine.js'),
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

                var token = body.jwt;
                if (token) {
                    resolve(token);
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

    var newMachine = new machine();

    // Used to spin up a new Portainer container
    var createNewPortainerInstance = function(machineModel, machineInfo, userToken) {

        function generateVncPassword() {
            return shajs('sha256').update(new Date().getMilliseconds()).digest('hex').substring(24, 32);
        }

        var vncPassword = generateVncPassword();

        return new Promise(function(resolve, reject) {

            request.post({
                url: "http://52.209.115.148:9000/api/endpoints/1/docker/containers/create",
                headers: {
                    Authorization: 'Bearer ' + userToken
                },
                json: {
                    name: machineInfo.name,
                    Image: machineInfo.base.buildId,
                    Env: ["VNC_PW=" + vncPassword],
                    ExposedPorts: {
                        "5901/tcp": {},
                        "6901/tcp": {}
                    },
                    HostConfig: {
                        "PortBindings": {
                            "5901/tcp": [{ "HostPort": "" }],
                            "6901/tcp": [{ "HostPort": "" }]
                        }
                    }
                }
            }, function(error, httpResponse, body) {

                // Checking for the error message
                if (error) { reject(error); }
                if (body) {

                    // Populate part of the model
                    machineModel.machineName = machineInfo.name;
                    machineModel.machineOwner = req.body.cert.CN;
                    machineModel.machineId = body.Id;
                    machineModel.machineVncPassword = vncPassword;

                    resolve(machineModel);

                }

            });

        });

    }

    var startPortainerInstance = function(machineModel, userToken) {
        return new Promise(function(resolve, reject) {

            request.post({
                url: "http://52.209.115.148:9000/api/endpoints/1/docker/containers/" + machineModel.machineId + "/start",
                headers: {
                    Authorization: 'Bearer ' + userToken
                }
            }, function(error, httpResponse, body) {

                // Checking for the error message
                if (error) { reject(error); }

                if (httpResponse.statusCode == 204) { // Started successfully

                    resolve(machineModel);

                }

            });

        });
    }

    var getContainerInfo = function(machineModel, userToken) {
        return new Promise(function(resolve, reject) {

            request.get({
                url: "http://52.209.115.148:9000/api/endpoints/1/docker/containers/" + machineModel.machineId + "/json",
                headers: {
                    Authorization: 'Bearer ' + userToken
                }
            }, function(error, httpResponse, body) {

                console.log(httpResponse.statusCode);

                // Checking for the error message
                if (error) { reject(error); }

                if (httpResponse.statusCode == 200) { // Started successfully

                    // Parsing the body
                    var bodyParsed = JSON.parse(body);

                    machineModel.machinePortVNC = bodyParsed.NetworkSettings.Ports['5901/tcp'][0].HostPort;
                    machineModel.machinePortNoVNC = bodyParsed.NetworkSettings.Ports['6901/tcp'][0].HostPort;

                    resolve(machineModel);

                }

            });

        });
    }

    // Basic validation
    if (machineInfo.name && machineInfo.base.buildId) {

        var userToken = req.body.authToken;

        createNewPortainerInstance(newMachine, machineInfo, userToken).then(function(machineModel) {
            return startPortainerInstance(machineModel, userToken);
        })
        .then(function(machineModel) {
            return getContainerInfo(machineModel, userToken);
        })
        .then(function(machineModel) {
            return machineModel.save();
        })
        .then(function(machineModel) {
            res.json({
                success: true,
                machine: machineModel
            });
        })
        .catch(function(err) {
            assert.ifError(err);
        });

    } else {
        res.json({
            success: false,
            message: "You must pass a name and a build type"
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