
app.controller('view_scripts', ['$scope', function($scope) {
  console.log('BOOTED scriptS CONTROLLER');
  $scope.ui.transcripts = [];

  $scope.loadScripts = function() {
    $scope.request({
      method: 'get',
      url: '/admin/api/scripts'
    }).then(function(scripts) {
      console.log('got scripts:', scripts);
      $scope.ui.scripts = scripts;
      $scope.$apply();
    }).catch($scope.handleError);
  }

  $scope.newScript = function() {
    $scope.request({
      method: 'post',
      url: '/admin/api/scripts',
      data: {
        version: 2,
        command: 'hello',
        threads: [{
          topic: 'default',
          messages: [{
            text: [
              'First!'
            ]
          }],
        }],
      }
    }).then(function() {
      $scope.loadScripts();
    }).catch($scope.handleError);
  }

  $scope.loadScripts();

}]);

app.controller('view_script', ['$scope', '$sce', function($scope, $sce) {

  $scope.ui.messages = [];
  $scope.ui.current_thread = '';

  console.log('BOOTED SINGLE script CONTROLLER');
  if (uid =window.location.href.match(/.*\/cms\/(.*)/)) {
    uid = uid[1];

    $scope.request({
      method: 'get',
      url: '/admin/api/scripts/' + uid
    }).then(function(script) {
      console.log('got script:', script);
      $scope.ui.script = script;
      $scope.selectThread('default');
      $scope.$apply();

    }).catch($scope.handleError);

  }

  $scope.selectThread = function(thread) {

    var desired_thread = $scope.ui.script.threads.filter(function(t) {
      return (t.topic == thread);
    })

    if (desired_thread.length) {
      $scope.ui.current_thread = desired_thread[0];
    }

  }


  $scope.newThread = function(new_thread_name, text) {

    if (!new_thread_name) {
      new_thread_name = 'Thread ' + $scope.ui.script.threads.length;
    }

    if (!text) {
      text = 'First!';
    }

    $scope.ui.script.threads.push({
      topic: new_thread_name,
      messages: [
        {
          text: [text]
        }
      ]
    });

    $scope.selectThread(new_thread_name);

  }

  $scope.render = function(message) {

    var text;
    if (Array.isArray(message.text)) {
      text = message.text[0];
    } else {
      text = message.text;
    }

    // TODO: render markdown!

    return $sce.trustAsHtml(text);
  }

  $scope.addMessage = function(blank) {
    if (blank) {
      $scope.ui.current_thread.messages.push({
        text: ['Edit me']
      });
    } else if ($scope.ui.new_message) {
      $scope.ui.current_thread.messages.push({
        text: [$scope.ui.new_message]
      });

      $scope.ui.new_message = '';
    }
  }

  $scope.logScript = function() {
    console.log($scope.ui.script);
  }

  $scope.editMessage = function(message) {
    $scope.ui.current_message = message;
    $scope.openDialog('/plugins/cms/message_detail.html');
  }

    $scope.save = function() {

      var script = JSON.parse(angular.toJson($scope.ui.script));

      $scope.request({
        method: 'post',
        url: '/admin/api/scripts/' + $scope.ui.script._id,
        data: script,
      }).then(function(res) {

      }).catch($scope.handleError);

    }

}]);


app.controller('message_detail', ['$scope', function($scope) {

  $scope.ui.text_version = 0;
  $scope.deleteBranches = function() {
    if (confirm('Delete selected items?')) {

      $scope.ui.current_message.branches = $scope.ui.current_message.branches.filter(function(b) {
        return (!b.$$selected);
      });

    }
  }

  $scope.addBranch = function(message) {
    if (!message.branches) {
      message.branches = [];
    }

    message.branches.push({
      pattern: 'test',
      type: 'string',
      action: 'next',
    });
  }

  console.log('BOOTED MESSAGE DETAIL');
}]);
