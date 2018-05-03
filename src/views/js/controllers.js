pancake.controller('dashboard', function($scope, loginServ) {
    // Login the user in when they hit the dashboard
    loginServ.login();
});

pancake.controller('machineView', function($scope, machine) {

    // Getting the machines
    $scope.machines = {};

    machine.getMachines().then(function(machines) {
        $scope.machines = machines;
    }).catch(function(error) {
        alert("Failed to get user machines");
        console.error(error);
    });

});

pancake.controller('newMachine', function($scope, machine) {

    $scope.machineTypes = {};

    machine.getMachineTypes().then(function(machineType) {
        $scope.machineTypes = machineType;
    }).catch(function(err) {
        alert("Failed to get machine types!");
        console.error(err);
    });

    $scope.startMachine = function(newMachine) {
        machine.newMachine(newMachine)
        .then(function(newMachine) {
            if (newMachine.data.success == false) {
                alert(newMachine.data.message);
            } else {
                alert("Successfully created " + newMachine.data.machine.machineName);
                $scope.machines += newMachine.machine;
            }
        })
        .catch(function(error) {
            alert("Failed to create a new machine.");
            console.error(error);
        });
    }

});