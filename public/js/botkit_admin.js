var app = angular.module('botkit_admin', ['dndLists']);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{%');
    $interpolateProvider.endSymbol('%}');
});

app.controller('app', ['$scope', '$http', '$location', function($scope, $http, $location) {

  console.log('Booted Botkit Admin app');
  $scope.ui = {};

  $scope.openDialog = function(template_path) {
    console.log('LOAD DIALOG', template_path);
    $scope.ui.dialog_template = template_path;
    $scope.ui.dialog_open = true;

  }

  $scope.closeDialog = function(event) {
    event.stopPropagation();
    $scope.ui.dialog_open = false;
  }


  $scope.select = function(item, list) {
      item.$$selected = !item.$$selected;
      if (!item.$$selected && $scope.ui.selectAll) {
          $scope.ui.selectAll = false;
      }
      $scope.bulkOps(list);
  }

  $scope.selectAll = function(list) {
      $scope.ui.selectAll = !$scope.ui.selectAll;
      for (var x = 0; x < list.length; x++) {
          list[x].$$selected = $scope.ui.selectAll;
      }
      $scope.bulkOps(list);
  }

  $scope.bulkOps = function(list) {
      $scope.ui.bulkOps = (list.filter(function(l) { return l.$$selected === true }).length > 0);
  }


  $scope.request = function(options) {
    return new Promise(function(resolve, reject) {
      $http(options).then(function(results) {
        resolve(results.data);
      }, reject);
    })
  }

  $scope.handleError = function(err) {
    alert(err);
  }

}]);
