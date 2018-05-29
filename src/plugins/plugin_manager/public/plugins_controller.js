
app.controller('pluginManager', ['$scope', function($scope) {

    console.log('booted plugin manager');

    $scope.request({
        url: '/admin/api/plugins',
    }).then(function(plugins) {
        console.log('LOADED PLUGINS', plugins);
        $scope.ui.plugins = plugins;
        $scope.$apply();
    });

    $scope.savePlugins = function() {

        $scope.request({
            method: 'post',
            url: '/admin/api/plugins',
            data: JSON.parse(angular.toJson($scope.ui.plugins))
        }).then(function(plugins) {
            console.log('SAVED PLUGINS', plugins);
        });

    }

}]);
