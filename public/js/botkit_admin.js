var app = angular.module('botkit_admin', ['dndLists','angular-clipboard']);

app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{%');
    $interpolateProvider.endSymbol('%}');
});

app.controller('app', ['$scope', '$http', '$location', '$sce', function($scope, $http, $location, $sce) {

  console.log('Booted Botkit Admin app');
  $scope.ui = {};

  $scope.goto = function(url) {
    window.location = url;
  }

  document.addEventListener('keyup', function(event) {
    if (event.which == 27) {
      $scope.$broadcast('escape_key');
    }
  });

  $scope.swallow = function($event) {
    $event.stopPropagation();
  }
  $scope.openDialog = function(template_path) {
    console.log('LOAD DIALOG', template_path);
    $scope.ui.dialog_template = template_path;
    $scope.ui.dialog_open = true;

  }

  $scope.closeDialog = function(event) {
    event.stopPropagation();
    $scope.ui.dialog_open = false;
  }

  $scope.bigInput = function(title, placeholder, value, submit, error) {
    $scope.ui.big = {
      title: title,
      placeholder: placeholder,
      value: value, // should make a copy so doesn't update by references
      submit: submit || 'Continue',
      error: error,
    }
    $scope.openDialog('/partials/bigInput.html');
    return new Promise(function(resolve, reject) {
      $scope.bigInputSubmit = function() {
        resolve($scope.ui.big.value);
        $scope.ui.dialog_open = false;
      }
      $scope.bigInputCancel = function() {
        $scope.ui.dialog_open = false;
        reject();
      }
    });
  }

  $scope.confirm = function(title) {
    $scope.ui.big = {
      title: title,
    }
    $scope.openDialog('/partials/confirm.html');
    return new Promise(function(resolve, reject) {
      $scope.bigInputSubmit = function() {
        resolve(true);
        $scope.ui.dialog_open = false;
      }
      $scope.bigInputCancel = function() {
        $scope.ui.dialog_open = false;
        reject(false);
      }
    });
  }


  $scope.asHTML = function(el) {
    console.log("TRUST THIS", el);
    return $sce.trustAsHtml(el);
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




 function truncateString(value, max, wordwise, tail) {
       if (!value) return '';

       max = parseInt(max, 10);
       if (!max) return value;
       if (value.length <= max) return value;

       value = value.substr(0, max);
       if (wordwise) {
           var lastspace = value.lastIndexOf(' ');
           if (lastspace !== -1) {
             //Also remove . and , so its gives a cleaner result.
             if (value.charAt(lastspace-1) === '.' || value.charAt(lastspace-1) === ',') {
               lastspace = lastspace - 1;
             }
             value = value.substr(0, lastspace);
           }
       }

       return value + (tail || ' …');
 }


app.filter('truncateString', function () {
         return function (value, max, wordwise, tail) {
           return truncateString(value, max, wordwise, tail);
         }
});
