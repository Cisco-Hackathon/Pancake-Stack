module.exports.checkUserCert = function(req, res, next) {
    var cert = req.socket.getPeerCertificate().subject;

    if (cert) {
        req.body.cert = cert;
        next();
    } else {
        res.send("You shall not pass!");
    }
}

module.exports.injectUserToken = function(req, res, next) {
    var token = req.headers['x-access-token'];

    if (token) {
        req.body.authToken = token;
        next();
    } else {
        res.json("You must be authenticated to use this route.");
    }
}