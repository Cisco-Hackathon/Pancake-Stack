var mongoose = require('mongoose');

var user = mongoose.Schema({
    sid: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    dataAdded: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('user', user);