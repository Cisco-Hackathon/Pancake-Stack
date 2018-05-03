var mongoose = require('mongoose');

var machineType = mongoose.Schema({
    buildName: {
        type: String,
        required: true
    },
    buildId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('machine_type', machineType);