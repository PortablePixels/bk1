app.controller('view_humans', ['$scope', function($scope) {
  console.log('BOOTED HUMANS CONTROLLER');
  $scope.ui.transcripts = [];

  $scope.request({
    method: 'get',
    url: '/admin/api/humans'
  }).then(function(humans) {
    console.log('got humans:', humans);
    $scope.ui.humans = humans;
    $scope.$apply();
  }).catch($scope.handleError);


}]);

app.controller('view_human', ['$scope', function($scope) {

  console.log('BOOTED SINGLE HUMAN CONTROLLER');
  if (uid =window.location.href.match(/.*\/humans\/(.*)/)) {
    uid = uid[1];
    $scope.ui.user_id = uid;

    $scope.request({
      method: 'get',
      url: '/admin/api/humans/' + uid
    }).then(function(human) {
      console.log('got human:', human);
      $scope.ui.human = human;
      $scope.$apply();
    }).catch($scope.handleError);

  }

}]);
