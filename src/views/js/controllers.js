pancake.controller('dashboard', function($scope, loginServ) {
    // Login the user in when they hit the dashboard
    loginServ.login();
});

pancake.controller('machineView', function($scope) {

});

pancake.controller('newMachine', function($scope, machine) {

    $scope.machineTypes = {};

    machine.getMachineTypes().then(function(machines) {
        $scope.machineTypes = machines;
    }).catch(function(err) {
        console.error(err);
    });

    $scope.startMachine = function(newMachine) {
        machine.newMachine(newMachine);
    }

});