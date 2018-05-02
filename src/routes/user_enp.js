// Used for getting the User's information
module.exports.getUserInfo = function(req, res) {
    console.log(req);
    res.json(req.body);
}