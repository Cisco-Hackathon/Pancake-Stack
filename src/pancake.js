// Requiring dependencies
var express = require('express'),
    mongoose = require('mongoose'),
    https = require('https'),
    http = require('http'),
    bodyParser = require('body-parser'),
    path = require('path'),
    morgan = require('morgan'),
    fs = require('fs'),
    app = express();

// Custom API endpoint + setting port
var api = express.Router(),
    apiPort = process.env.API_PORT || 443;

// Importing API + app endpoints
var user_enp = require("./routes/user_enp.js"),
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
api.get('/user', user_enp.getUserInfo);

// App endpoints
app.get('/', app_enp.home);
app.get('/register', app_enp.register);
app.get('/dashboard', app_enp.dashboard);

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
})
.catch(function(error) {
    throw error;
});
