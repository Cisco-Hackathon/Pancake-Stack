var mongoose = require('mongoose');

var machine = mongoose.Schema({
    machineName: {
        type: String,
        required: true
    },
    machineOwner: {
        type: String,
        required: true
    },
    dateProvisioned: {
        type: Date,
        default: Date.now()
    },
    machineId: {
        type: String,
        required: true
    },
    machinePortNoVNC: {
        type: String,
        required: true
    },
    machinePortVNC: {
        type: String,
        required: true
    },
    machineVncPassword: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('machine', machine);