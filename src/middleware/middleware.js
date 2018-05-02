module.exports.checkUserCert = function(req, res, next) {
    var cert = req.socket.getPeerCertificate();
    if (cert) {
        req.body.cert = cert;
        next();
    } else {
        res.send("You shall not pass!");
    }
}

module.exports.checkUserExists = function() {

}