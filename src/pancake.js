// Requiring dependencies
var express = require('express'),
    mongoose = require('mongoose'),
    https = require('https'),
    http = require('http'),
    bodyParser = require('body-parser'),
    path = require('path'),
    request = require('request'),
    morgan = require('morgan'),
    fs = require('fs'),
    assert = require('assert'),
    app = express();

// Custom API endpoint + setting port
var api = express.Router(),
    apiPort = process.env.API_PORT || 443;

// Importing API + app endpoints
var api_enp = require("./routes/api_enp.js"),
    app_enp = require("./routes/app_enp.js");

// Importing middleware
var middleware = require("./middleware/middleware.js");

// Setting the app up
app.use('/api', api);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(middleware.checkUserCert);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Setting the API up
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));
api.use(morgan('dev'));
api.use(middleware.checkUserCert);

// API endpoints
api.get('/auth', api_enp.authUser);

// App endpoints
app.get('/', app_enp.home);
app.get('/register', app_enp.register);
app.get('/dashboard', app_enp.dashboard);

// Setting Mongoose promise
mongoose.promise = global.Promise;

// Used to connect to MongoDB
var connectToDatabase = function() {
    console.log("[+] Connecting to database...");
    return mongoose.connect("mongodb://localhost/pancake-stack");
}

// Used to authenticate with Portainer
var portainerApiAuth = function() {

    console.log("[+] Authenticating with Portainer API...");

    var username = process.env.PORTAINER_USER || "admin",
        password = process.env.PORTAINER_PASS || "pancakestack";

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
                var token = process.env.PORTAINER_AUTH_TOKEN = body.jwt;
                if (token) {
                    resolve();
                }
            } else {
                reject(body);
            }

        });
    });


}

// Used to start the API
var startApi = function(apiPort) {

    console.log("[+] Starting HTTPS server");

    return new Promise(function(resolve, reject) {

        var sslServer = https.createServer({
            key: fs.readFileSync('./_certs/server-key.pem'),
            cert: fs.readFileSync('./_certs/server-crt.pem'),
            requestCert: true,
            rejectUnauthorized: false
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
    return portainerApiAuth();
})
.then(function() {
    console.log("\tAuthenticated with Portainer API.");
})
.catch(function(error) {
    assert.ifError(error);
});
