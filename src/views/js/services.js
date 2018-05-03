pancake.factory('machine', function($q, $http) {
    return {
        getMachineTypes: function() {
            var q = $q.defer();
            $http.get('https://localhost/api/machineTypes')
            .then(function(response) {
                q.resolve(response.data);
            })
            .catch(function(err) {
                q.reject(err);
            });
            return q.promise;
        },
        newMachine: function(newMachine) {
            var q = $q.defer();
            $http.post("https://localhost/api/newMachine", {
                machineData: newMachine
            }).then(function(response) {
                q.resolve(response);
            }).catch(function(err) {
                q.reject(err);
            });
            return q.promise;
        }
    }
});

// loginServ
pancake.factory('loginServ', function($q, $http, tokenServ) {
    return {
        login: function(login) {
            $http.get("https://localhost/api/auth")
            .then(function(response){
                console.log(response);
                tokenServ.setToken(response.data)
                .catch(function(err) {
                    console.log(err);
                    alert(err);
                })
            })
            .catch(function(err) {
                console.log(err);
                alert(err);
            })
        }
    }
});

pancake.factory('tokenServ', function($q) {
    return {
        getToken: function() {
            // Creating the promise
            var q = $q.defer();
            // Checking that a token actually exists
            this.checkToken()
            .then(function(cb) {
                if (cb === true) {
                    var token = window.localStorage.getItem("auth-token");
                    q.resolve(token);
                } else if (cb === false) {
                    q.reject(false);
                }
            })
            // Sending back promise
            return q.promise;
        },
        unsetToken: function() {
            // Deleting the token
            var q = $q.defer();
            window.localStorage.removeItem("auth-token");
            // Check if it has
            this.checkToken()
            .then(function(result) {
                if (result === true) {
                    q.reject("Failed to unset token!");
                } else if (result === false) {
                    q.resolve();
                }
            })
            return q.promise;
        },
        checkToken: function() {
            // Used to check if the token is set
            var q = $q.defer();
            // Checking the token
            var token = window.localStorage.getItem("auth-token");
            if (token === null) {
                q.resolve(false);
            } else if (token) {
                q.resolve(true);
            }
            // Sending back to promise
            return q.promise;
        },
        setToken: function(token_to_set) {
            // Creating the promise
            var q = $q.defer();
            // Setting the token
            window.localStorage['auth-token'] = token_to_set;
            // Checking that the token is set
            this.checkToken()
            .then(function() {
                q.resolve();
            })
            .catch(function() {
                q.reject("Failed to set token!");
            })
            return q.promise;
        }
    }
});

// HTTP interceptor
pancake.factory('httpInterceptor', function($q, tokenServ, $injector) {
    return {
        request: function(control) {
            // Injecting token
            tokenServ.getToken()
            .then(function(token) {
                // Setting token in Headers
                 control.headers = {
                    'x-access-token': token,
                    'Content-Type': 'application/json'
                }
            })
            return $q.resolve(control);
        },
        requestError: function(rejection) {
            return $q.reject(rejection);
        },
        response: function(response) {
            return $q.resolve(response);
        },
        responseError: function(rejection) {
            // Checking the response
            if (rejection.status === -1) { // Lost connection
                rejection.message = "Lost connection!";
            } else if (rejection.status === 404) {
                rejection.message = "API Could not be found :(";
            } else if (rejection.status === 403 || rejection.status === 401 || rejection.status === 502) {
                rejection.message = rejection.data.message;
            } else {
                rejection.message = rejection.data.message;
            }
            return $q.reject(rejection);
        }
    }
})