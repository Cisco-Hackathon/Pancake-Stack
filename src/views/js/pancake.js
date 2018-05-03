var pancake = angular.module("pancake", ["ngRoute"]);

pancake.config(function($routeProvider, $httpProvider) {

    $routeProvider
    .when('/', {
        templateUrl: '/partials/machine_view.htm',
        controller: 'machineView'
    })
    .when('/new_machine', {
        templateUrl: '/partials/provision_new_machine.htm',
        controller: 'newMachine'
    });

    $httpProvider.interceptors.push('httpInterceptor');

});