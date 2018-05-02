// Requiring dependencies
var express = require('express'),
    mongoose = require('mongoose'),
    https = require('https'),
    bodyParser = require('body-parser'),
    pem = require('pem'),
    app = express();

// Custom API endpoint + setting port
var api = express.Router(),
    apiPort = process.env.API_PORT || 8080;

// Importing API endpoints
var _api_get = require('./routes/_api_get.js'),
    _api_post = require('.routes/_get_post.js');

// Setting the app up
app.use('/api', api);
app.set('view engine', 'ejs');

// Setting the API up
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));

// API endpoints
api.get('/', function(req, res) {
    res.sendStatus(200);
});

// Used to connect to MongoDB
var connectToDatabase = function() {
    console.log("[+] Connecting to database...");
    return mongoose.connect("mongodb://127.0.0.1/pancake-stack");
}

// Used to start the API
var startApi = function(apiPort) {
    return new Promise(function(resolve, reject) {

        // Creating an SSL certificate
        console.log("[+] Generating SSL certificate...");

        pem.createCertificate({ days: 1, selfSigned: true }, function(err, keys) {

            // Checking for errors
            if (err) { reject(err); }

            console.log("\tGenerated certificate.")
            var apiSSL = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app);

            // Trying to start the API
            try {
                // Starting the API
                apiSSL.listen(apiPort, function(apiPort) {
                    resolve();
                });

            } catch (error) {
                reject(error);
            }

        });

    });
}

// Starting the API
startApi(apiPort)
.then(function() {
    console.log("\tAPI Started.");
    return connectToDatabase();
})
.then(function() {
    console.log("\tConnected to database.");
})
.catch(function(error) {
    throw error;
});

