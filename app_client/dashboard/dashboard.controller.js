(function() { 

  angular
    .module('nerveCenter')
    .controller('dashboardCtrl', dashboardCtrl);

  function dashboardCtrl($scope, $http, $location, $uibModal, $log, $document, meanData, auth) {
    var $dash = this;

    $dash.widgets = {};
    $scope.$watch('widgets', function(widgets){
      console.log("changed");
    }, true);

var myOptionArray = [
        {
            text: 'Carl Sagan',
            image: 'img/Drive.png',
            value: 0,
        },
        {
            text: 'Stephen Hawking',
            image: 'img/BNK.png',
            value: 1,
        },
        {
            text: 'Michio Kaku',
            image: 'img/Drive.png',
            value: 2,
        }
];
$scope.logIt = function(url) {
  console.log("logged: ", url);
}
    $scope.icons = [
      {name: "wiki", img: "Wiki"},
      {name: "BNK", img: "Bank"},
      {name: "GitHub", img: "GitHub"},
      {name: "Notes", img: "Notes"}
    ];

    // jQuery("body select").msDropDown();

    function updateWidgets() {
      meanData.getProfile()
        .success(function(data) {
          $dash.widgets = data.widgets;
        })
        .error(function(e) {
          console.log(e);
        })
        .finally(function() {
          $scope.widgets = angular.fromJson($dash.widgets);
          $scope.gridOptions = gridOptions;
        });
    }

    updateWidgets();

    $scope.saveWidgets = function() {
      data = "{}";

      meanData.updateWidgets()
        .success(function(data) {
          $dash.widgets = data.widgets;
        })
        .error(function(e) {
          console.log(e);
        })
        .finally(function() {
          // $scope.widgets = angular.fromJson($dash.widgets);
          // $scope.gridOptions = gridOptions;
        });
    }

    $scope.update = function() {
      id = auth.currentUser().id;
      console.log(id);
      $http.put('/api/user/' + $scope.contact._id, $scope.contact)
        .success(function(response) {
          refresh();
        })
    };

    $dash.open = function(size, parentSelector) {
      var parentElem = parentSelector ? 
        angular.element($document[0].querySelector('.modal-demo')) : undefined;
      var modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: 'myModalContent.html',
        controller: 'utilityModalCtrl',
        controllerAs: '$dash',
        size: size,
        appendTo: parentElem,
        resolve: {
          items: function() {
            return $dash.items;
          }
        }
      });
    };

    $dash.onLongPress = function() {
      $dash.open();
    };
  };

})();

