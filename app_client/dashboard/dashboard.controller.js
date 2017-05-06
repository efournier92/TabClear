(function () { 

  angular
    .module('nerveCenter')
    .controller('dashboardCtrl', dashboardCtrl);

  function dashboardCtrl($scope, $http, $location, 
    $uibModal, $log, $document, $filter, $window, apiData, auth) {

    var $dshBrd = this;

    $scope.draggable = false;
    $scope.deleteEnabled = false;
    $scope.urlsEnabled = true;
    $scope.areIconsLoaded = false;

    updateWidgets();
    getIcons();

    function instantiateGridster() {
      var width = this.window.innerWidth;
      var adjustedGridOptions = gridOptions;
      if (width > 1000) {
        adjustedGridOptions.columns = 7; 
      } else if (width > 500) {
        adjustedGridOptions.columns = 6; 
      } else {
        adjustedGridOptions.columns =3;
      }
      return adjustedGridOptions;
    }

    function checkScreenSize() {
      var start = $window.innerWidth;
      if (start > 1000) {
        $dshBrd.screenSize = 'lg';
      } else if (start > 500) {
        $dshBrd.screenSize = 'md';
      } else {
        $dshBrd.screenSize = 'sm';
      }
    }

    function updateWidgets() {
      checkScreenSize();
      apiData.getProfile()
        .success(function (user) {
          $dshBrd.widgetsLg = angular.fromJson(user.widgetsLg);
          $dshBrd.widgetsMd = angular.fromJson(user.widgetsMd);
          $dshBrd.widgetsSm = angular.fromJson(user.widgetsSm);
        })
        .error(function () {
          $scope.openAuthModal();
        })
        .finally(function () {
          if ($dshBrd.screenSize == 'lg') {
            $scope.widgets = $dshBrd.widgetsLg;
          } else if ($dshBrd.screenSize == 'md') {
            $scope.widgets = $dshBrd.widgetsMd;
          } else {
            $scope.widgets = $dshBrd.widgetsSm;
          }
          $scope.gridOptions = instantiateGridster();
          $dshBrd.currentWidth = $window.innerWidth;
        });
    }

    $dshBrd.saveWidgets = function () {
      checkScreenSize();

      if ($dshBrd.screenSize == 'lg') {
        $dshBrd.widgetsLg = $scope.widgets;
      } else if ($dshBrd.screenSize == 'md') {
        $dshBrd.widgetsMd = $scope.widgets;
      } else {
        $dshBrd.widgetsSm = $scope.widgets;
      }

      data = [
        $dshBrd.widgetsLg,
        $dshBrd.widgetsMd,
        $dshBrd.widgetsSm
      ];

      apiData.updateWidgets(data)
        .success(function (data) {
          console.log("Success!: ", data)
        })
        .error(function (e) {
          console.log(e);
        });
    }

    $scope.createWidget = function () {
      var widgetUrl = $scope.widgetUrl;
      var widgetWeight = $scope.widgetWeight;
      var widgetIcon = $scope.selectedIcon;

      var defaultIcon = "img/_blank.png";
      // Handle null values 
      if (!widgetUrl && widgetIcon === defaultIcon) {
        window.alert("Please Enter URL and Select an Icon");
        return;
      } else if (!widgetUrl) {
        window.alert("Please Enter URL");
        return;
      } else if (widgetIcon === defaultIcon) {
        window.alert("Please Select an Icon");
        return;
      }

      function pushNewWidget(size) {
        if (size === 'lg') {
          var len = $dshBrd.widgetsLg.length;
          var columns = 7;
          var newWidget = createNewWidget(len, columns);
          $dshBrd.widgetsLg.push(newWidget);
        } else if (size === 'md') {
          var len = $dshBrd.widgetsMd.length;
          var columns = 6;
          var newWidget = createNewWidget(len, columns);
          $dshBrd.widgetsMd.push(newWidget);
        } else if (size === 'sm') {
          var len = $dshBrd.widgetsSm.length;
          var columns = 3;
          var newWidget = createNewWidget(len, columns);
          $dshBrd.widgetsSm.push(newWidget);
        }
      }

      function createNewWidget(len, columns) {
        var newWidget = {
          icon: widgetIcon,
          url: widgetUrl,
          row: Math.floor(len / columns),
          col: (len % columns) + 1 
        }
      }

      pushNewWidget('lg');
      pushNewWidget('md');
      pushNewWidget('sm');

      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    }


    $scope.importWidgets = function () {
      var widgetString = angular.fromJson($scope.widgetString);
      $scope.widgets = widgetString;

      checkScreenSize();
      if ($dshBrd.screenSize == 'lg') {
        $dshBrd.widgetsLg = widgetString;
      } else if ($dshBrd.screenSize == 'md') {
        $dshBrd.widgetsMd = widgetString;
      } else {
        $dshBrd.widgetsSm = widgetString;
      }

      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    } 

    $scope.deleteWidget = function (widget) {
      $scope.widgets = $scope.widgets.filter(function (element){
        return element.url != widget.url;
      });

      $dshBrd.saveWidgets();
    }

    $scope.toggleDraggable = function () {
      gridOptions.draggable.enabled = !gridOptions.draggable.enabled;
      $scope.urlsEnabled = !$scope.urlsEnabled;
      if ($scope.deleteEnabled)
        $scope.deleteEnabled = false;
      if (!gridOptions.draggable.enabled)
        $dshBrd.saveWidgets();
    }

    $scope.toggleDelete = function () {
      $scope.deleteEnabled = !$scope.deleteEnabled;
      $scope.urlsEnabled = !$scope.urlsEnabled;
      if (gridOptions.draggable.enabled)
        gridOptions.draggable.enabled = false;
    }

    function getIcons() {
      apiData.getIcons()
        .success(function (icons) {
          $dshBrd.icons = icons;
        })
        .finally(function () {
          $dshBrd.allIcons = [];
          var len = $dshBrd.icons.length;

          for (i = 0; i < len; i++) {
            var iconObj = {};
            var iconString = 'img/ico/' + $dshBrd.icons[i];
            iconObj.path = iconString;
            $dshBrd.allIcons.push(iconObj);
          }
          $scope.shownIcons = [];
          $scope.loadSomeIcons();
        });
    }

    $scope.loadAllIcons = function () {
      var shownLen = $scope.shownIcons.length;
      var totalIcons = $dshBrd.allIcons.length;
      var iconsRemaining = totalIcons - shownLen - 1;
      $scope.areIconsLoaded = true;
      for (var i = shownLen; i <= iconsRemaining; i++) {
        var newIco = $dshBrd.allIcons[shownLen + i]
        $scope.shownIcons.push(newIco);
      }
    }

    $scope.loadSomeIcons = function () {
      var shownLen = $scope.shownIcons.length;
      for (var i = 1; i <= 24; i++) {
        var newIco = $dshBrd.allIcons[shownLen + i]
        $scope.shownIcons.push(newIco);
      }
    }

    $scope.gridsterModalOptions = gridsterModalOptions;
    $scope.selectedIcon = "img/_blank.png";

    $scope.selectIcon = function (iconPath) {
      $scope.selectedIcon = iconPath;
    }

    $scope.openMainModal = function (size, parentSelector) {
      gridOptions.draggable.enabled = false;
      $scope.deleteEnabled = false;

      var parentElem = parentSelector ? 
        angular.element($document[0].querySelector('.modal-demo')) : undefined;

      var modalInstance = $uibModal.open({
        templateUrl: 'mainModal.html',
        controller: 'dashboardCtrl',
        size: 'lg',
        appendTo: parentElem
      });
    };

    $scope.openAuthModal = function (size, parentSelector) {
      var parentElem = parentSelector ? 
        angular.element($document[0].querySelector('.main-modal')) : undefined;

      var modalInstance = $uibModal.open({
        templateUrl: 'authModal.html',
        controller: 'authCtrl',
        controllerAs: '$auth',
        appendTo: parentElem,
      });
    };

    $scope.onLogout = function () {
      auth.logout();
      $location.path('dashboard.view');
    }

    $scope.syncWidgets = function () {
      $dshBrd.widgetsLg = $scope.widgets;
      $dshBrd.widgetsMd = $scope.widgets;
      $dshBrd.widgetsSm = $scope.widgets;
      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    }

    $scope.resetWidgets = function () {
      checkScreenSize();

      apiData.getDefaultGrid()
        .success(function (defaultGrid) {
          defaultGrid = angular.fromJson(defaultGrid);
          $scope.widgets = defaultGrid;
          if ($dshBrd.screenSize == 'lg') {
            $dshBrd.widgetsLg = defaultGrid;
          } else if ($dshBrd.screenSize == 'md') {
            $dshBrd.widgetsMd = defaultGrid;
          } else {
            $dshBrd.widgetsSm = defaultGrid;
          }
        })
        .error(function (e) {
          console.log(e);
        })
        .finally(function () {
          $dshBrd.saveWidgets();
        });
    }

    var resizeBreaks = {
      'md' : 1000,
      'sm' : 500
    };

    angular.element($window).bind('resize', function () {
      var oldWidth = $dshBrd.currentWidth;
      var newWidth = $window.innerWidth;

      if ((oldWidth > resizeBreaks['md'] && newWidth < resizeBreaks['md'])
        || (oldWidth < resizeBreaks['md'] && newWidth > resizeBreaks['md'])
        || (oldWidth > resizeBreaks['sm'] && newWidth < resizeBreaks['sm'])
        || (oldWidth < resizeBreaks['sm'] && newWidth > resizeBreaks['sm'])) {

        updateWidgets();
      }
    });

  };
})();

