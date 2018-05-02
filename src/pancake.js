// Requiring dependencies
var express = require('express'),
    mongoose = require('mongoose'),
    https = require('https'),
    http = require('http'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    fs = require('fs'),
    app = express();

// Custom API endpoint + setting port
var api = express.Router(),
    apiPort = process.env.API_PORT || 443;

// Importing API endpoints
var user_enp = require("./routes/user_enp.js");

// Setting the app up
app.use('/api', api);
app.set('view engine', 'ejs');

// Setting the API up
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));
api.use(morgan('dev'));

// API endpoints
api.get('/', function(req, res) { // Health check
    res.sendStatus(200);
});

api.get('/user', user_enp.getUserInfo);

// Used to connect to MongoDB
var connectToDatabase = function() {
    console.log("[+] Connecting to database...");
    return mongoose.connect("mongodb://localhost/pancake-stack");
}

// Used to start the API
var startApi = function(apiPort) {

    console.log("[+] Starting HTTPS server");

    return new Promise(function(resolve, reject) {

        var sslServer = https.createServer({
            key: fs.readFileSync('./_certs/server-key.pem'),
            cert: fs.readFileSync('./_certs/server-crt.pem'),
            ca: fs.readFileSync('./_certs/ca-crt.pem')
        }, app);

        try {
            sslServer.listen(apiPort, function() {
                resolve();
            });
        } catch (err) {
            reject(err);
        }

    });
}

// Starting the API
startApi(apiPort)
.then(function() {
    console.log("\tAPI Started on port: " + apiPort);
    return connectToDatabase();
})
.then(function() {
    console.log("\tConnected to database.");
})
.catch(function(error) {
    throw error;
});
