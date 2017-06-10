(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {

  angular.module('nerveCenter', ['ngRoute', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'gridster', 'infinite-scroll', 'ds.clock']);

  function config($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
      templateUrl: 'dashboard/dashboard.view.html',
      controller: 'dashboardCtrl'
    }).otherwise({ redirectTo: '/' });

    // HTML5 History API
    $locationProvider.html5Mode(true);
  }

  function run($rootScope, $location, $http, auth) {
    $rootScope.$on('$routeChangeStart', function (event, nextRoute, currentRoute) {
      if ($location.path() === '/profile' && !auth.isLoggedIn()) {
        $location.path('/');
      }
    });
  }

  angular.module('nerveCenter').config(['$routeProvider', '$locationProvider', config]).run(['$rootScope', '$location', '$uibModal', 'auth', run]);
})();

(function () {
  angular.module('nerveCenter').controller('authCtrl', authCtrl);

  authCtrl.$inject = ['$location', 'auth', 'apiData'];
  function authCtrl($location, auth, apiData) {
    var $auth = this;

    $auth.credentials = {
      email: "",
      password: ""
    };

    $auth.onReg = function () {
      auth.register($auth.credentials).error(function (err) {
        alert("Sorry, you didn't fill in both fields.\nPlease try again.");
      }).then(function () {
        auth.login($auth.credentials);
        $location.path('../dashboard/dashboard.view');
      });
    };

    $auth.user = {};

    $auth.onLogin = function () {
      auth.login($auth.credentials).error(function (err) {
        alert("Sorry, the username and password you entered don't match.\nPlease try again.");
      }).then(function () {
        $location.path('../dashboard/dashboard.view');
      });
    };
  }
})();

(function () {

  angular.module('nerveCenter').service('auth', auth);

  auth.$inject = ['$http', '$window'];
  function auth($http, $window) {

    var saveToken = function (token) {
      $window.localStorage['mean-token'] = token;
    };

    var getToken = function () {
      return $window.localStorage['mean-token'];
    };

    var isLoggedIn = function () {
      var token = getToken();
      var payload;

      if (token) {
        payload = token.split('.')[1];
        payload = $window.atob(payload);
        payload = JSON.parse(payload);

        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };

    var currentUser = function () {
      if (isLoggedIn()) {
        var token = getToken();
        var payload = token.split('.')[1];
        payload = $window.atob(payload);
        payload = JSON.parse(payload);
        return {
          id: payload._id,
          email: payload.email,
          widgets: payload.widgets
        };
      }
    };

    register = function (user) {
      return $http.post('/api/register', user).success(function (data) {
        saveToken(data.token);
      });
    };

    login = function (user) {
      return $http.post('/api/login', user).success(function (data) {
        saveToken(data.token);
      });
    };

    logout = function () {
      $window.localStorage.removeItem('mean-token');
    };

    return {
      currentUser: currentUser,
      saveToken: saveToken,
      getToken: getToken,
      isLoggedIn: isLoggedIn,
      register: register,
      login: login,
      logout: logout
    };
  }
})();

(function () {

  angular.module('nerveCenter').controller('dashboardCtrl', dashboardCtrl);

  function dashboardCtrl($scope, $http, $location, $uibModal, $log, $document, $filter, $window, apiData, auth) {

    var $dshBrd = this;

    $scope.draggable = false;
    $scope.deleteEnabled = false;
    $scope.urlsEnabled = true;
    $scope.areIconsLoaded = false;
    $scope.deleteIcon = 'img/_x.png';
    $scope.lockIcon = 'img/_locked.png';

    updateWidgets();
    getIcons();

    function instantiateGridster() {
      var width = this.window.outerWidth;
      var adjustedGridOptions = gridOptions;
      if (width > 500) {
        adjustedGridOptions.columns = 7;
      } else {
        adjustedGridOptions.columns = 3;
      }
      return adjustedGridOptions;
    }

    function checkScreenSize() {
      var start = $window.outerWidth;
      if (start > 500) {
        $dshBrd.screenSize = 'lg';
      } else {
        $dshBrd.screenSize = 'sm';
      }
    }

    function updateToolIconSize() {
      $scope.toolIconSize = $dshBrd.screenSize == 'sm' ? $scope.toolIconSize = 28 + 'px' : $scope.toolIconSize = 20 + 'px';
    }

    updateToolIconSize();

    function updateWidgets() {
      checkScreenSize();
      $dshBrd.lastScreenSize = inputScreenSize($window.outerWidth);
      apiData.getProfile().success(function (user) {
        $dshBrd.widgetsLg = angular.fromJson(user.widgetsLg);
        $dshBrd.widgetsSm = angular.fromJson(user.widgetsSm);
      }).error(function () {
        $scope.openAuthModal();
      }).finally(function () {
        $scope.widgets = $dshBrd.screenSize == 'lg' ? $dshBrd.widgetsLg : $dshBrd.widgetsSm;
        console.log($scope.widgets);
        $scope.gridOptions = instantiateGridster();
        $dshBrd.currentWidth = $window.outerWidth;
      });
    }

    $dshBrd.saveWidgets = function () {
      checkScreenSize();

      if ($dshBrd.screenSize == 'lg') {
        $dshBrd.widgetsLg = $scope.widgets;
      } else {
        $dshBrd.widgetsSm = $scope.widgets;
      }

      console.log('Save: ', $scope.widgets);

      data = [$dshBrd.widgetsLg, $dshBrd.widgetsSm];

      apiData.updateWidgets(data).success(function (data) {
        console.log("Success!: ", data);
      }).error(function (e) {
        console.log(e);
      });
    };

    $scope.createWidget = function () {
      var widgetUrl = $scope.widgetUrl;
      var widgetWeight = $scope.widgetWeight;
      var widgetIcon = $scope.selectedIcon;
      console.log(widgetIcon);

      var defaultIcon = "img/_blank.png";
      // Form validation
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

      $scope.widgetTemplate = '/dashboard/widgetTemplates/link-widget.template.html';
      $scope.getWidgetTemplate = function () {
        return '/dashboard/widgetTemplates/link-widget.template.html';
      };

      function pushNewWidget(size) {
        if (size === 'lg') {
          var len = $dshBrd.widgetsLg.length;
          var columns = 7;
          var newWidget = createNewWidget(len, columns);
          $dshBrd.widgetsLg.push(newWidget);
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
          col: len % columns + 1
        };
        return newWidget;
      }

      pushNewWidget('lg');
      pushNewWidget('sm');

      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    };

    $scope.importWidgets = function () {
      var widgetString = angular.fromJson($scope.widgetString);
      $scope.widgets = widgetString;

      checkScreenSize();
      if ($dshBrd.screenSize == 'lg') {
        $dshBrd.widgetsLg = widgetString;
      } else {
        $dshBrd.widgetsSm = widgetString;
      }

      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    };

    $scope.deleteWidget = function (widget) {
      console.log("Delete: ", widget);
      $scope.widgets = $scope.widgets.filter(function (element) {
        return element.url != widget.url;
      });

      $dshBrd.saveWidgets();
    };

    $scope.toggleDraggable = function () {
      gridOptions.draggable.enabled = !gridOptions.draggable.enabled;
      $scope.urlsEnabled = !$scope.urlsEnabled;

      if ($scope.deleteEnabled) {
        $scope.deleteEnabled = false;
        $scope.deleteIcon = 'img/_x.png';
      }

      if (gridOptions.draggable.enabled) {
        $scope.lockIcon = 'img/_lockedRed.png';
      } else {
        $scope.lockIcon = 'img/_locked.png';
      }

      if (!gridOptions.draggable.enabled) $dshBrd.saveWidgets();
    };

    $scope.toggleDelete = function () {
      $scope.deleteEnabled = !$scope.deleteEnabled;
      $scope.urlsEnabled = !$scope.urlsEnabled;

      if ($scope.deleteEnabled) {
        $scope.deleteIcon = 'img/_xRed.png';
      } else {
        $scope.deleteIcon = 'img/_x.png';
      }

      if (gridOptions.draggable.enabled) {
        gridOptions.draggable.enabled = false;
        $scope.lockIcon = 'img/_locked.png';
      }
    };

    function getIcons() {
      apiData.getIcons().success(function (icons) {
        $dshBrd.icons = icons;
      }).finally(function () {
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
        var newIco = $dshBrd.allIcons[shownLen + i];
        $scope.shownIcons.push(newIco);
      }
      console.log($scope.shownIcons);
    };

    $scope.loadSomeIcons = function () {
      var shownLen = $scope.shownIcons.length;
      for (var i = 1; i <= 24; i++) {
        var newIco = $dshBrd.allIcons[shownLen + i];
        $scope.shownIcons.push(newIco);
      }
    };

    $scope.gridsterModalOptions = gridsterModalOptions;
    $scope.selectedIcon = "img/_blank.png";

    $scope.selectIcon = function (iconPath) {
      $scope.selectedIcon = iconPath;
    };

    $scope.openMainModal = function (size, parentSelector) {
      gridOptions.draggable.enabled = false;
      $scope.deleteEnabled = false;

      var parentElem = parentSelector ? angular.element($document[0].querySelector('.modal-demo')) : undefined;

      var modalInstance = $uibModal.open({
        templateUrl: 'mainModal.html',
        controller: 'dashboardCtrl',
        size: 'lg',
        appendTo: parentElem
      });
    };

    $scope.openAuthModal = function (size, parentSelector) {
      var parentElem = parentSelector ? angular.element($document[0].querySelector('.main-modal')) : undefined;

      var modalInstance = $uibModal.open({
        templateUrl: 'authModal.html',
        controller: 'authCtrl',
        controllerAs: '$auth',
        appendTo: parentElem
      });
    };

    $scope.onLogout = function () {
      auth.logout();
      $location.path('dashboard.view');
    };

    $scope.syncWidgets = function () {
      $dshBrd.widgetsLg = $scope.widgets;
      $dshBrd.widgetsSm = $scope.widgets;
      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    };

    $scope.resetWidgets = function () {
      checkScreenSize();

      apiData.getDefaultGrid().success(function (defaultGrid) {
        defaultGrid = angular.fromJson(defaultGrid);
        $scope.widgets = defaultGrid;
        if ($dshBrd.screenSize == 'lg') {
          $dshBrd.widgetsLg = defaultGrid;
        } else {
          $dshBrd.widgetsSm = defaultGrid;
        }
      }).error(function (e) {
        console.log(e);
      }).finally(function () {
        $dshBrd.saveWidgets();
        $location.path('dashboard.view');
      });
    };

    $scope.clearGrid = function () {
      $scope.widgets = [];
      if ($dshBrd.screenSize == 'lg') {
        $dshBrd.widgetsLg = [];
      } else {
        $dshBrd.widgetsSm = [];
      }
      $dshBrd.saveWidgets();
      $location.path('dashboard.view');
    };

    var resizeBreaks = {
      'sm': 500
    };

    function inputScreenSize(width) {
      if (width > 500) {
        return 'lg';
      } else {
        return 'sm';
      }
    }

    function logIt(type) {
      console.log("Type:", type);
    }

    angular.element($window).bind('resize', function () {
      var oldWidth = $dshBrd.currentWidth;
      var oldSize = $dshBrd.lastScreenSize;
      var newWidth = $window.outerWidth;
      var newSize = inputScreenSize(newWidth);

      if (oldSize !== newSize) {
        $location.path('dashboard.view');
      }

      $dshBrd.lastScreenSize = newSize;
    });

    $scope.logIt = function (widget) {
      console.log(widget);
    };
  };
})();

(function () {

  angular.module('nerveCenter').directive('clockWidget', clockWidget);

  function clockWidget() {
    return {
      restrict: 'AEC',
      templateUrl: function (elem, attrs) {
        return "/dashboard/widgetTemplates/clock-widget.template.html";
      }
    };
  };
})();

(function () {

  angular.module('nerveCenter').directive('renderWidget', renderWidget);

  function renderWidget() {
    return {
      restrict: 'AEC',
      templateUrl: function (elem, attrs) {
        console.log(attrs);
        return "/dashboard/widgetTemplates/" + attrs.type + ".template.html";
      }
    };
  };
})();

(function () {

  angular.module('nerveCenter').directive('scrolly', scrolly);

  function scrolly($window) {
    return {
      restrict: 'AEC',
      link: function (scope, element, attrs) {
        var raw = element[0];
        console.log('loading directive');

        element.bind('scroll', function () {
          console.log('in scroll');
          console.log(raw.scrollTop + raw.offsetHeight);
          console.log(raw.scrollHeight);
          if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
            scope.$apply(attrs.scrolly);
          }
        });
      }
      // return {
      //   restrict: 'A',
      //   link: function(scope, element, attrs) {
      //     var raw = element[0];

      //     element.bind('scroll', function () {
      //       // var yPosition = raw.scrollTop + raw.offsetHeight;
      //       // if (yPosition > scope.lastYPosition) {
      //         console.log('in scroll');
      //         console.log(raw.scrollTop + raw.offsetHeight);
      //         console.log(raw.scrollHeight);
      //       // }
      //       scope.lastYPosition = yPosition;
      //     });
      //   }
      // };
    };
  };
});

(function () {

  angular.module('nerveCenter').directive('selectText', selectText);

  function selectText($window) {
    return {
      link: function (scope, element) {
        element.on('click', function () {
          var selection = $window.getSelection();
          var range = document.createRange();
          range.selectNodeContents(element[0]);
          selection.removeAllRanges();
          selection.addRange(range);
        });
      }
    };
  }
})();

(function () {

  angular.module('nerveCenter').service('apiData', apiData);

  apiData.$inject = ['$http', 'auth'];
  function apiData($http, auth) {

    var getProfile = function () {
      return $http.get('/api/user', {
        headers: {
          Authorization: 'Bearer ' + auth.getToken()
        }
      });
    };

    var updateWidgets = function (data) {
      return $http.put('/api/user', data, {
        headers: {
          Authorization: 'Bearer ' + auth.getToken()
        }
      });
    };

    var getIcons = function (data) {
      return $http.get('/api/ico', data, {
        headers: {
          Authorization: 'Bearer ' + auth.getToken()
        }
      });
    };

    var getDefaultGrid = function (data) {
      return $http.get('/api/defaultgrid', data, {
        headers: {
          Authorization: 'Bearer ' + auth.getToken()
        }
      });
    };

    return {
      getProfile: getProfile,
      updateWidgets: updateWidgets,
      getIcons: getIcons,
      getDefaultGrid: getDefaultGrid
    };
  }
})();

var allIcons = [{ icon: "img/BNK.png" }, { icon: "img/CNN.png" }, { icon: "img/Drive.png" }, { icon: "img/FreePress.png" }, { icon: "img/GitHub.png" }, { icon: "img/Google.png" }, { icon: "img/Image.png" }, { icon: "img/Indeed.png" }, { icon: "img/Launch.png" }, { icon: "img/Linked.png" }, { icon: "img/Notes.png" }, { icon: "img/ReadLater.png" }, { icon: "img/RTorrent.png" }, { icon: "img/Slack.png" }, { icon: "img/Tape.png" }, { icon: "img/Trend.png" }, { icon: "img/Tube.png" }, { icon: "img/Twitter.png" }, { icon: "img/Wiki.png" }];

var gridOptions = {
  columns: 7,
  pushing: true,
  floating: true,
  swapping: true,
  width: 'auto',
  colWidth: 'auto',
  rowHeight: 'match',
  margins: [10, 10],
  outerMargin: true,
  sparse: false,
  isMobile: false,
  mobileBreakPoint: 600,
  mobileModeEnabled: false,
  defaultSizeX: 1,
  defaultSizeY: 1,
  resizable: {
    enabled: false
  },
  draggable: {
    enabled: false,
    stop: function (event, $element, widget) {
      console.log($element.scope().gridster.grid);
      // console.log($element.scope().gridster.grid);
    }
  }
};

var gridsterModalOptions = {
  columns: 6,
  pushing: true,
  floating: true,
  swapping: true,
  width: 'auto',
  colWidth: 'auto',
  rowHeight: 'match',
  margins: [10, 10],
  outerMargin: true,
  sparse: false,
  isMobile: false,
  mobileBreakPoint: 600,
  mobileModeEnabled: false,
  minColumns: 1,
  minRows: 1,
  maxRows: 100,
  defaultSizeX: 1,
  defaultSizeY: 1,
  minSizeX: 1,
  maxSizeX: null,
  minSizeY: 1,
  maxSizeY: null,
  resizable: {
    enabled: false,
    handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
    start: function (event, $element, widget) {},
    resize: function (event, $element, widget) {},
    stop: function (event, $element, widget) {}
  },
  draggable: {
    enabled: false,
    handle: '.my-class',
    start: function (event, $element, widget) {},
    drag: function (event, $element, widget) {},
    stop: function (event, $element, widget) {}
  }
};

var calcGridOptions = {
  columns: 6,
  pushing: true,
  floating: true,
  swapping: true,
  width: 'auto',
  colWidth: 'auto',
  rowHeight: 'match',
  margins: [9, 9],
  outerMargin: true,
  sparse: false,
  isMobile: false,
  mobileBreakPoint: 600,
  mobileModeEnabled: false,
  defaultSizeX: 1,
  defaultSizeY: 1,
  resizable: {
    enabled: false
  },
  draggable: {
    enabled: false,
    stop: function (event, $element, widget) {
      console.log($element.scope().gridster.grid);
      // console.log($element.scope().gridster.grid);
    }
  }
};

(function () {

  angular.module('nerveCenter').factory('ncCalcButtons', ncCalcButtons);

  function ncCalcButtons() {
    var factory = {};

    factory.digits = function () {
      var buttonKeys = ['7', '8', '9', '0', 'c', '<-', '4', '5', '6', '.', '-', '+', '1', '2', '3', '=', '/', '*'];

      var len = buttonKeys.length - 1;

      var i;
      var buttons = [];

      for (i = 0; i <= len; i++) {
        newObj = {};
        newObj.key = buttonKeys[i];
        newObj.col = Math.floor((i + 1) / 6);
        newObj.row = i - 6 * newObj.col;
        buttons.push(newObj);
      }

      return buttons;
    };
    return factory;
  }
})();

(function () {

  angular.module('nerveCenter').controller('ncCalcCtrl', ncCalcCtrl);

  function ncCalcCtrl($scope, ncCalcButtons) {
    $scope.out = '';
    $scope.result = 0;
    $scope.calcGridOptions = calcGridOptions;

    $scope.display = function (number) {

      if ($scope.out != 'undefined' && number != '=' && number != 'c' && number != '<-') {
        $scope.out = $scope.out + number;
      }

      if ($scope.calinput != '') {
        switch (number) {

          case 'c':
            //Cancel
            //resets display
            $scope.out = '';
            break;

          case '<-':
            //Backspace
            $scope.out = $scope.out.slice(0, -1);
            break;

          case '=':
            //Calculate
            if ($scope.checksymbol($scope.out)) {
              $scope.out = eval($scope.out).toString();
            }
            break;

          default:
            break;
        }
      }
    };

    /* 
    Check whether the string contains a restricted charater
    in first or last postion
    @param string number
    */
    $scope.checksymbol = function (number) {
      var notallow = ['+', '-', '/', '*', '.', ''];
      if (notallow.indexOf(number.slice(-1)) > -1 || notallow.indexOf(number.slice(0, 1)) > -1) {
        return false;
      }
      return true;
    };

    //Set the keyboard values using the factory method.  
    $scope.mykeys = ncCalcButtons.digits();
  }
})();

(function () {

  angular.module('nerveCenter').directive('ncCalc', ncCalc);

  function ncCalc() {
    return {
      restrict: 'AEC',
      controller: 'ncCalcCtrl',
      templateUrl: '/dashboard/nc-calc/nc-calc.template.html'
      // template: '<div  class="calculator">'
      //           +'<div class="u4 display">'
      //           +'<div class="display-inner">{{out}}</div>'
      //           +'</div>'
      //           +'<button ng-repeat="calkey in mykeys track by $index" ng-click="display(calkey)" '
      //           +'ng-class="{\'u2\': calkey == \'0\' || calkey == \'<-\', \'button-blue\' : calkey == \'=\' , \'button-red\' : calkey == \'c\' }"'
      //           +'class="u1 button button-gray" >'
      //           +'<div ng-if="calkey!=\'<-\'">{{calkey}}</div>'
      //           +'<div ng-if="calkey==\'<-\'">B</div>'
      //           +'</button>'
      //           +'</div>'
      //           +'</div>'
    };
  }
})();



},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHBfY2xpZW50XFxhcHAubWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsQ0FBQyxZQUFZOztBQUVYLFVBQVEsTUFBUixDQUFlLGFBQWYsRUFDRSxDQUFDLFNBQUQsRUFBWSxXQUFaLEVBQXlCLFlBQXpCLEVBQXVDLGNBQXZDLEVBQ0MsVUFERCxFQUNhLGlCQURiLEVBQ2dDLFVBRGhDLENBREY7O0FBSUEsV0FBUyxNQUFULENBQWdCLGNBQWhCLEVBQWdDLGlCQUFoQyxFQUFtRDtBQUNqRCxtQkFDRyxJQURILENBQ1EsR0FEUixFQUNhO0FBQ1QsbUJBQWEsK0JBREo7QUFFVCxrQkFBWTtBQUZILEtBRGIsRUFLRyxTQUxILENBS2EsRUFBQyxZQUFZLEdBQWIsRUFMYjs7QUFPQTtBQUNBLHNCQUFrQixTQUFsQixDQUE0QixJQUE1QjtBQUNEOztBQUVELFdBQVMsR0FBVCxDQUFhLFVBQWIsRUFBeUIsU0FBekIsRUFBb0MsS0FBcEMsRUFBMkMsSUFBM0MsRUFBaUQ7QUFDL0MsZUFBVyxHQUFYLENBQWUsbUJBQWYsRUFBb0MsVUFBUyxLQUFULEVBQWdCLFNBQWhCLEVBQTJCLFlBQTNCLEVBQXlDO0FBQzNFLFVBQUksVUFBVSxJQUFWLE9BQXFCLFVBQXJCLElBQW1DLENBQUMsS0FBSyxVQUFMLEVBQXhDLEVBQTJEO0FBQ3pELGtCQUFVLElBQVYsQ0FBZSxHQUFmO0FBQ0Q7QUFDRixLQUpEO0FBS0Q7O0FBRUQsVUFDRyxNQURILENBQ1UsYUFEVixFQUVHLE1BRkgsQ0FFVSxDQUFDLGdCQUFELEVBQW1CLG1CQUFuQixFQUF3QyxNQUF4QyxDQUZWLEVBR0csR0FISCxDQUdPLENBQUMsWUFBRCxFQUFlLFdBQWYsRUFBNEIsV0FBNUIsRUFBeUMsTUFBekMsRUFBaUQsR0FBakQsQ0FIUDtBQUtELENBL0JEOztBQWlDQSxDQUFDLFlBQVk7QUFDWCxVQUNHLE1BREgsQ0FDVSxh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V0FBUyxNQUFULEdBQWtCO0FBQ2hCLFdBQU87QUFDTCxnQkFBVSxLQURMO0FBRUwsa0JBQVksWUFGUDtBQUdMLG1CQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBZkssS0FBUDtBQWlCRDtBQUNGLENBekJEOztBQTRCQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKCkge1xuXG4gIGFuZ3VsYXIubW9kdWxlKCduZXJ2ZUNlbnRlcicsXG4gICAgWyduZ1JvdXRlJywgJ25nQW5pbWF0ZScsICduZ1Nhbml0aXplJywgJ3VpLmJvb3RzdHJhcCcsXG4gICAgICdncmlkc3RlcicsICdpbmZpbml0ZS1zY3JvbGwnLCAnZHMuY2xvY2snXSk7XG5cbiAgZnVuY3Rpb24gY29uZmlnKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgICRyb3V0ZVByb3ZpZGVyXG4gICAgICAud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdkYXNoYm9hcmQvZGFzaGJvYXJkLnZpZXcuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdkYXNoYm9hcmRDdHJsJyxcbiAgICAgIH0pXG4gICAgICAub3RoZXJ3aXNlKHtyZWRpcmVjdFRvOiAnLyd9KTtcblxuICAgIC8vIEhUTUw1IEhpc3RvcnkgQVBJXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcnVuKCRyb290U2NvcGUsICRsb2NhdGlvbiwgJGh0dHAsIGF1dGgpIHtcbiAgICAkcm9vdFNjb3BlLiRvbignJHJvdXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihldmVudCwgbmV4dFJvdXRlLCBjdXJyZW50Um91dGUpIHtcbiAgICAgIGlmICgkbG9jYXRpb24ucGF0aCgpID09PSAnL3Byb2ZpbGUnICYmICFhdXRoLmlzTG9nZ2VkSW4oKSkge1xuICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ25lcnZlQ2VudGVyJylcbiAgICAuY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCAnJGxvY2F0aW9uUHJvdmlkZXInLCBjb25maWddKVxuICAgIC5ydW4oWyckcm9vdFNjb3BlJywgJyRsb2NhdGlvbicsICckdWliTW9kYWwnLCAnYXV0aCcsIHJ1bl0pO1xuXG59KSgpO1xuXG4oZnVuY3Rpb24gKCkge1xuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnbmVydmVDZW50ZXInKVxuICAgIC5jb250cm9sbGVyKCdhdXRoQ3RybCcsIGF1dGhDdHJsKTtcblxuICBhdXRoQ3RybC4kaW5qZWN0ID0gWyckbG9jYXRpb24nLCAnYXV0aCcsICdhcGlEYXRhJ107XG4gIGZ1bmN0aW9uIGF1dGhDdHJsKCRsb2NhdGlvbiwgYXV0aCwgYXBpRGF0YSkge1xuICAgIHZhciAkYXV0aCA9IHRoaXM7XG5cbiAgICAkYXV0aC5jcmVkZW50aWFscyA9IHtcbiAgICAgIGVtYWlsIDogXCJcIixcbiAgICAgIHBhc3N3b3JkIDogXCJcIlxuICAgIH07XG5cbiAgICAkYXV0aC5vblJlZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGF1dGhcbiAgICAgICAgLnJlZ2lzdGVyKCRhdXRoLmNyZWRlbnRpYWxzKVxuICAgICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgYWxlcnQoXCJTb3JyeSwgeW91IGRpZG4ndCBmaWxsIGluIGJvdGggZmllbGRzLlxcblBsZWFzZSB0cnkgYWdhaW4uXCIpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXV0aC5sb2dpbigkYXV0aC5jcmVkZW50aWFscylcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLi4vZGFzaGJvYXJkL2Rhc2hib2FyZC52aWV3Jyk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgXG4gICAgJGF1dGgudXNlciA9IHt9O1xuXG4gICAgJGF1dGgub25Mb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGF1dGhcbiAgICAgICAgLmxvZ2luKCRhdXRoLmNyZWRlbnRpYWxzKVxuICAgICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgYWxlcnQoXCJTb3JyeSwgdGhlIHVzZXJuYW1lIGFuZCBwYXNzd29yZCB5b3UgZW50ZXJlZCBkb24ndCBtYXRjaC5cXG5QbGVhc2UgdHJ5IGFnYWluLlwiKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcuLi9kYXNoYm9hcmQvZGFzaGJvYXJkLnZpZXcnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbn0pKCk7XG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ25lcnZlQ2VudGVyJylcbiAgICAuc2VydmljZSgnYXV0aCcsIGF1dGgpO1xuXG4gIGF1dGguJGluamVjdCA9IFsnJGh0dHAnLCAnJHdpbmRvdyddO1xuICBmdW5jdGlvbiBhdXRoKCRodHRwLCAkd2luZG93KSB7XG5cbiAgICB2YXIgc2F2ZVRva2VuID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICAgICR3aW5kb3cubG9jYWxTdG9yYWdlWydtZWFuLXRva2VuJ10gPSB0b2tlbjtcbiAgICB9O1xuXG4gICAgdmFyIGdldFRva2VuID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICR3aW5kb3cubG9jYWxTdG9yYWdlWydtZWFuLXRva2VuJ107XG4gICAgfTtcblxuICAgIHZhciBpc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHRva2VuID0gZ2V0VG9rZW4oKTtcbiAgICAgIHZhciBwYXlsb2FkO1xuXG4gICAgICBpZih0b2tlbil7XG4gICAgICAgIHBheWxvYWQgPSB0b2tlbi5zcGxpdCgnLicpWzFdO1xuICAgICAgICBwYXlsb2FkID0gJHdpbmRvdy5hdG9iKHBheWxvYWQpO1xuICAgICAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShwYXlsb2FkKTtcblxuICAgICAgICByZXR1cm4gcGF5bG9hZC5leHAgPiBEYXRlLm5vdygpIC8gMTAwMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGN1cnJlbnRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYoaXNMb2dnZWRJbigpKXtcbiAgICAgICAgdmFyIHRva2VuID0gZ2V0VG9rZW4oKTtcbiAgICAgICAgdmFyIHBheWxvYWQgPSB0b2tlbi5zcGxpdCgnLicpWzFdO1xuICAgICAgICBwYXlsb2FkID0gJHdpbmRvdy5hdG9iKHBheWxvYWQpO1xuICAgICAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShwYXlsb2FkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZCA6IHBheWxvYWQuX2lkLFxuICAgICAgICAgIGVtYWlsIDogcGF5bG9hZC5lbWFpbCxcbiAgICAgICAgICB3aWRnZXRzIDogcGF5bG9hZC53aWRnZXRzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJlZ2lzdGVyID0gZnVuY3Rpb24odXNlcikge1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcmVnaXN0ZXInLCB1c2VyKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICBzYXZlVG9rZW4oZGF0YS50b2tlbik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9naW4gPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9sb2dpbicsIHVzZXIpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBzYXZlVG9rZW4oZGF0YS50b2tlbik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnbWVhbi10b2tlbicpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgY3VycmVudFVzZXIgOiBjdXJyZW50VXNlcixcbiAgICAgIHNhdmVUb2tlbiA6IHNhdmVUb2tlbixcbiAgICAgIGdldFRva2VuIDogZ2V0VG9rZW4sXG4gICAgICBpc0xvZ2dlZEluIDogaXNMb2dnZWRJbixcbiAgICAgIHJlZ2lzdGVyIDogcmVnaXN0ZXIsXG4gICAgICBsb2dpbiA6IGxvZ2luLFxuICAgICAgbG9nb3V0IDogbG9nb3V0XG4gICAgfTtcbiAgfVxuXG59KSgpO1xuXG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ25lcnZlQ2VudGVyJylcbiAgICAuY29udHJvbGxlcignZGFzaGJvYXJkQ3RybCcsIGRhc2hib2FyZEN0cmwpO1xuXG4gIGZ1bmN0aW9uIGRhc2hib2FyZEN0cmwoJHNjb3BlLCAkaHR0cCwgJGxvY2F0aW9uLFxuICAgICR1aWJNb2RhbCwgJGxvZywgJGRvY3VtZW50LCAkZmlsdGVyLCAkd2luZG93LCBhcGlEYXRhLCBhdXRoKSB7XG5cbiAgICB2YXIgJGRzaEJyZCA9IHRoaXM7XG5cbiAgICAkc2NvcGUuZHJhZ2dhYmxlID0gZmFsc2U7XG4gICAgJHNjb3BlLmRlbGV0ZUVuYWJsZWQgPSBmYWxzZTtcbiAgICAkc2NvcGUudXJsc0VuYWJsZWQgPSB0cnVlO1xuICAgICRzY29wZS5hcmVJY29uc0xvYWRlZCA9IGZhbHNlO1xuICAgICRzY29wZS5kZWxldGVJY29uID0gJ2ltZy9feC5wbmcnO1xuICAgICRzY29wZS5sb2NrSWNvbiA9ICdpbWcvX2xvY2tlZC5wbmcnO1xuXG4gICAgdXBkYXRlV2lkZ2V0cygpO1xuICAgIGdldEljb25zKCk7XG5cbiAgICBmdW5jdGlvbiBpbnN0YW50aWF0ZUdyaWRzdGVyKCkge1xuICAgICAgdmFyIHdpZHRoID0gdGhpcy53aW5kb3cub3V0ZXJXaWR0aDtcbiAgICAgIHZhciBhZGp1c3RlZEdyaWRPcHRpb25zID0gZ3JpZE9wdGlvbnM7XG4gICAgICBpZiAod2lkdGggPiA1MDApIHtcbiAgICAgICAgYWRqdXN0ZWRHcmlkT3B0aW9ucy5jb2x1bW5zID0gNztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFkanVzdGVkR3JpZE9wdGlvbnMuY29sdW1ucyA9IDM7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWRqdXN0ZWRHcmlkT3B0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1NjcmVlblNpemUoKSB7XG4gICAgICB2YXIgc3RhcnQgPSAkd2luZG93Lm91dGVyV2lkdGg7XG4gICAgICBpZiAoc3RhcnQgPiA1MDApIHtcbiAgICAgICAgJGRzaEJyZC5zY3JlZW5TaXplID0gJ2xnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRkc2hCcmQuc2NyZWVuU2l6ZSA9ICdzbSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlVG9vbEljb25TaXplKCkgeyBcbiAgICAgICRzY29wZS50b29sSWNvblNpemUgPSBcbiAgICAgICAgJGRzaEJyZC5zY3JlZW5TaXplID09ICdzbSdcbiAgICAgICAgPyAkc2NvcGUudG9vbEljb25TaXplID0gMjggKyAncHgnXG4gICAgICAgIDogJHNjb3BlLnRvb2xJY29uU2l6ZSA9IDIwICsgJ3B4JztcbiAgICB9XG5cbiAgICB1cGRhdGVUb29sSWNvblNpemUoKTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVdpZGdldHMoKSB7XG4gICAgICBjaGVja1NjcmVlblNpemUoKTtcbiAgICAgICRkc2hCcmQubGFzdFNjcmVlblNpemUgPSBpbnB1dFNjcmVlblNpemUoJHdpbmRvdy5vdXRlcldpZHRoKTsgXG4gICAgICBhcGlEYXRhLmdldFByb2ZpbGUoKVxuICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICRkc2hCcmQud2lkZ2V0c0xnID0gYW5ndWxhci5mcm9tSnNvbih1c2VyLndpZGdldHNMZyk7XG4gICAgICAgICAgJGRzaEJyZC53aWRnZXRzU20gPSBhbmd1bGFyLmZyb21Kc29uKHVzZXIud2lkZ2V0c1NtKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkc2NvcGUub3BlbkF1dGhNb2RhbCgpO1xuICAgICAgICB9KVxuICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJHNjb3BlLndpZGdldHMgPSBcbiAgICAgICAgICAgICRkc2hCcmQuc2NyZWVuU2l6ZSA9PSAnbGcnXG4gICAgICAgICAgICA/ICRkc2hCcmQud2lkZ2V0c0xnXG4gICAgICAgICAgICA6ICRkc2hCcmQud2lkZ2V0c1NtO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS53aWRnZXRzKTtcbiAgICAgICAgICAkc2NvcGUuZ3JpZE9wdGlvbnMgPSBpbnN0YW50aWF0ZUdyaWRzdGVyKCk7XG4gICAgICAgICAgJGRzaEJyZC5jdXJyZW50V2lkdGggPSAkd2luZG93Lm91dGVyV2lkdGg7XG4gICAgICAgIH0pO1xuICB9XG5cbiAgJGRzaEJyZC5zYXZlV2lkZ2V0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBjaGVja1NjcmVlblNpemUoKTtcblxuICAgIGlmICgkZHNoQnJkLnNjcmVlblNpemUgPT0gJ2xnJykge1xuICAgICAgJGRzaEJyZC53aWRnZXRzTGcgPSAkc2NvcGUud2lkZ2V0cztcbiAgICB9IGVsc2Uge1xuICAgICAgJGRzaEJyZC53aWRnZXRzU20gPSAkc2NvcGUud2lkZ2V0cztcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnU2F2ZTogJywgJHNjb3BlLndpZGdldHMpO1xuXG4gICAgZGF0YSA9IFtcbiAgICAgICRkc2hCcmQud2lkZ2V0c0xnLFxuICAgICAgJGRzaEJyZC53aWRnZXRzU21cbiAgICBdO1xuXG4gICAgYXBpRGF0YS51cGRhdGVXaWRnZXRzKGRhdGEpXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlN1Y2Nlc3MhOiBcIiwgZGF0YSlcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICB9KTtcbiAgfVxuXG4gICRzY29wZS5jcmVhdGVXaWRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHdpZGdldFVybCA9ICRzY29wZS53aWRnZXRVcmw7XG4gICAgdmFyIHdpZGdldFdlaWdodCA9ICRzY29wZS53aWRnZXRXZWlnaHQ7XG4gICAgdmFyIHdpZGdldEljb24gPSAkc2NvcGUuc2VsZWN0ZWRJY29uO1xuICAgIGNvbnNvbGUubG9nKHdpZGdldEljb24pO1xuXG4gICAgdmFyIGRlZmF1bHRJY29uID0gXCJpbWcvX2JsYW5rLnBuZ1wiO1xuICAgIC8vIEZvcm0gdmFsaWRhdGlvblxuICAgIGlmICghd2lkZ2V0VXJsICYmIHdpZGdldEljb24gPT09IGRlZmF1bHRJY29uKSB7XG4gICAgICB3aW5kb3cuYWxlcnQoXCJQbGVhc2UgRW50ZXIgVVJMIGFuZCBTZWxlY3QgYW4gSWNvblwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKCF3aWRnZXRVcmwpIHtcbiAgICAgIHdpbmRvdy5hbGVydChcIlBsZWFzZSBFbnRlciBVUkxcIik7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmICh3aWRnZXRJY29uID09PSBkZWZhdWx0SWNvbikge1xuICAgICAgd2luZG93LmFsZXJ0KFwiUGxlYXNlIFNlbGVjdCBhbiBJY29uXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICRzY29wZS53aWRnZXRUZW1wbGF0ZSA9ICcvZGFzaGJvYXJkL3dpZGdldFRlbXBsYXRlcy9saW5rLXdpZGdldC50ZW1wbGF0ZS5odG1sJztcbiAgICAkc2NvcGUuZ2V0V2lkZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gJy9kYXNoYm9hcmQvd2lkZ2V0VGVtcGxhdGVzL2xpbmstd2lkZ2V0LnRlbXBsYXRlLmh0bWwnO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBwdXNoTmV3V2lkZ2V0KHNpemUpIHtcbiAgICAgIGlmIChzaXplID09PSAnbGcnKSB7XG4gICAgICAgIHZhciBsZW4gPSAkZHNoQnJkLndpZGdldHNMZy5sZW5ndGg7XG4gICAgICAgIHZhciBjb2x1bW5zID0gNztcbiAgICAgICAgdmFyIG5ld1dpZGdldCA9IGNyZWF0ZU5ld1dpZGdldChsZW4sIGNvbHVtbnMpO1xuICAgICAgICAkZHNoQnJkLndpZGdldHNMZy5wdXNoKG5ld1dpZGdldCk7XG4gICAgICB9IGVsc2UgaWYgKHNpemUgPT09ICdzbScpIHtcbiAgICAgICAgdmFyIGxlbiA9ICRkc2hCcmQud2lkZ2V0c1NtLmxlbmd0aDtcbiAgICAgICAgdmFyIGNvbHVtbnMgPSAzO1xuICAgICAgICB2YXIgbmV3V2lkZ2V0ID0gY3JlYXRlTmV3V2lkZ2V0KGxlbiwgY29sdW1ucyk7XG4gICAgICAgICRkc2hCcmQud2lkZ2V0c1NtLnB1c2gobmV3V2lkZ2V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVOZXdXaWRnZXQobGVuLCBjb2x1bW5zKSB7XG4gICAgICB2YXIgbmV3V2lkZ2V0ID0ge1xuICAgICAgICBpY29uOiB3aWRnZXRJY29uLFxuICAgICAgICB1cmw6IHdpZGdldFVybCxcbiAgICAgICAgcm93OiBNYXRoLmZsb29yKGxlbiAvIGNvbHVtbnMpLFxuICAgICAgICBjb2w6IChsZW4gJSBjb2x1bW5zKSArIDFcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXdXaWRnZXQ7XG4gICAgfVxuXG4gICAgcHVzaE5ld1dpZGdldCgnbGcnKTtcbiAgICBwdXNoTmV3V2lkZ2V0KCdzbScpO1xuXG4gICAgJGRzaEJyZC5zYXZlV2lkZ2V0cygpO1xuICAgICRsb2NhdGlvbi5wYXRoKCdkYXNoYm9hcmQudmlldycpO1xuICB9XG5cblxuICAgICRzY29wZS5pbXBvcnRXaWRnZXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHdpZGdldFN0cmluZyA9IGFuZ3VsYXIuZnJvbUpzb24oJHNjb3BlLndpZGdldFN0cmluZyk7XG4gICAgICAkc2NvcGUud2lkZ2V0cyA9IHdpZGdldFN0cmluZztcblxuICAgICAgY2hlY2tTY3JlZW5TaXplKCk7XG4gICAgICBpZiAoJGRzaEJyZC5zY3JlZW5TaXplID09ICdsZycpIHtcbiAgICAgICAgJGRzaEJyZC53aWRnZXRzTGcgPSB3aWRnZXRTdHJpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkZHNoQnJkLndpZGdldHNTbSA9IHdpZGdldFN0cmluZztcbiAgICAgIH1cblxuICAgICAgJGRzaEJyZC5zYXZlV2lkZ2V0cygpO1xuICAgICAgJGxvY2F0aW9uLnBhdGgoJ2Rhc2hib2FyZC52aWV3Jyk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmRlbGV0ZVdpZGdldCA9IGZ1bmN0aW9uICh3aWRnZXQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRGVsZXRlOiBcIiwgd2lkZ2V0KTtcbiAgICAgICRzY29wZS53aWRnZXRzID0gJHNjb3BlLndpZGdldHMuZmlsdGVyKGZ1bmN0aW9uIChlbGVtZW50KXtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQudXJsICE9IHdpZGdldC51cmw7XG4gICAgICB9KTtcblxuICAgICAgJGRzaEJyZC5zYXZlV2lkZ2V0cygpO1xuICAgIH1cblxuICAgICRzY29wZS50b2dnbGVEcmFnZ2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBncmlkT3B0aW9ucy5kcmFnZ2FibGUuZW5hYmxlZCA9ICFncmlkT3B0aW9ucy5kcmFnZ2FibGUuZW5hYmxlZDtcbiAgICAgICRzY29wZS51cmxzRW5hYmxlZCA9ICEkc2NvcGUudXJsc0VuYWJsZWQ7XG5cbiAgICAgIGlmICgkc2NvcGUuZGVsZXRlRW5hYmxlZCkge1xuICAgICAgICAkc2NvcGUuZGVsZXRlRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuZGVsZXRlSWNvbiA9ICdpbWcvX3gucG5nJztcbiAgICAgIH1cblxuICAgICAgaWYgKGdyaWRPcHRpb25zLmRyYWdnYWJsZS5lbmFibGVkKSB7XG4gICAgICAgICRzY29wZS5sb2NrSWNvbiA9ICdpbWcvX2xvY2tlZFJlZC5wbmcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHNjb3BlLmxvY2tJY29uID0gJ2ltZy9fbG9ja2VkLnBuZyc7XG4gICAgICB9XG5cbiAgICAgIGlmICghZ3JpZE9wdGlvbnMuZHJhZ2dhYmxlLmVuYWJsZWQpXG4gICAgICAgICRkc2hCcmQuc2F2ZVdpZGdldHMoKTtcbiAgICB9XG5cbiAgICAkc2NvcGUudG9nZ2xlRGVsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgJHNjb3BlLmRlbGV0ZUVuYWJsZWQgPSAhJHNjb3BlLmRlbGV0ZUVuYWJsZWQ7XG4gICAgICAkc2NvcGUudXJsc0VuYWJsZWQgPSAhJHNjb3BlLnVybHNFbmFibGVkO1xuXG4gICAgICBpZiAoJHNjb3BlLmRlbGV0ZUVuYWJsZWQpIHtcbiAgICAgICAgJHNjb3BlLmRlbGV0ZUljb24gPSAnaW1nL194UmVkLnBuZyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc2NvcGUuZGVsZXRlSWNvbiA9ICdpbWcvX3gucG5nJztcbiAgICAgIH1cblxuICAgICAgaWYgKGdyaWRPcHRpb25zLmRyYWdnYWJsZS5lbmFibGVkKSB7XG4gICAgICAgIGdyaWRPcHRpb25zLmRyYWdnYWJsZS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5sb2NrSWNvbiA9ICdpbWcvX2xvY2tlZC5wbmcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEljb25zKCkge1xuICAgICAgYXBpRGF0YS5nZXRJY29ucygpXG4gICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChpY29ucykge1xuICAgICAgICAgICRkc2hCcmQuaWNvbnMgPSBpY29ucztcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRkc2hCcmQuYWxsSWNvbnMgPSBbXTtcbiAgICAgICAgICB2YXIgbGVuID0gJGRzaEJyZC5pY29ucy5sZW5ndGg7XG5cbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpY29uT2JqID0ge307XG4gICAgICAgICAgICB2YXIgaWNvblN0cmluZyA9ICdpbWcvaWNvLycgKyAkZHNoQnJkLmljb25zW2ldO1xuICAgICAgICAgICAgaWNvbk9iai5wYXRoID0gaWNvblN0cmluZztcbiAgICAgICAgICAgICRkc2hCcmQuYWxsSWNvbnMucHVzaChpY29uT2JqKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJHNjb3BlLnNob3duSWNvbnMgPSBbXTtcbiAgICAgICAgICAkc2NvcGUubG9hZFNvbWVJY29ucygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUubG9hZEFsbEljb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNob3duTGVuID0gJHNjb3BlLnNob3duSWNvbnMubGVuZ3RoO1xuICAgICAgdmFyIHRvdGFsSWNvbnMgPSAkZHNoQnJkLmFsbEljb25zLmxlbmd0aDtcbiAgICAgIHZhciBpY29uc1JlbWFpbmluZyA9IHRvdGFsSWNvbnMgLSBzaG93bkxlbiAtIDE7XG4gICAgICAkc2NvcGUuYXJlSWNvbnNMb2FkZWQgPSB0cnVlO1xuICAgICAgZm9yICh2YXIgaSA9IHNob3duTGVuOyBpIDw9IGljb25zUmVtYWluaW5nOyBpKyspIHtcbiAgICAgICAgdmFyIG5ld0ljbyA9ICRkc2hCcmQuYWxsSWNvbnNbc2hvd25MZW4gKyBpXVxuICAgICAgICAkc2NvcGUuc2hvd25JY29ucy5wdXNoKG5ld0ljbyk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2hvd25JY29ucyk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmxvYWRTb21lSWNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2hvd25MZW4gPSAkc2NvcGUuc2hvd25JY29ucy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8PSAyNDsgaSsrKSB7XG4gICAgICAgIHZhciBuZXdJY28gPSAkZHNoQnJkLmFsbEljb25zW3Nob3duTGVuICsgaV1cbiAgICAgICAgJHNjb3BlLnNob3duSWNvbnMucHVzaChuZXdJY28pO1xuICAgICAgfVxuICAgIH1cblxuICAgICRzY29wZS5ncmlkc3Rlck1vZGFsT3B0aW9ucyA9IGdyaWRzdGVyTW9kYWxPcHRpb25zO1xuICAgICRzY29wZS5zZWxlY3RlZEljb24gPSBcImltZy9fYmxhbmsucG5nXCI7XG5cbiAgICAkc2NvcGUuc2VsZWN0SWNvbiA9IGZ1bmN0aW9uIChpY29uUGF0aCkge1xuICAgICAgJHNjb3BlLnNlbGVjdGVkSWNvbiA9IGljb25QYXRoO1xuICAgIH1cblxuICAgICRzY29wZS5vcGVuTWFpbk1vZGFsID0gZnVuY3Rpb24gKHNpemUsIHBhcmVudFNlbGVjdG9yKSB7XG4gICAgICBncmlkT3B0aW9ucy5kcmFnZ2FibGUuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmRlbGV0ZUVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgdmFyIHBhcmVudEVsZW0gPSBwYXJlbnRTZWxlY3RvciA/XG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkZG9jdW1lbnRbMF0ucXVlcnlTZWxlY3RvcignLm1vZGFsLWRlbW8nKSkgOiB1bmRlZmluZWQ7XG5cbiAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ21haW5Nb2RhbC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ2Rhc2hib2FyZEN0cmwnLFxuICAgICAgICBzaXplOiAnbGcnLFxuICAgICAgICBhcHBlbmRUbzogcGFyZW50RWxlbVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5vcGVuQXV0aE1vZGFsID0gZnVuY3Rpb24gKHNpemUsIHBhcmVudFNlbGVjdG9yKSB7XG4gICAgICB2YXIgcGFyZW50RWxlbSA9IHBhcmVudFNlbGVjdG9yID9cbiAgICAgICAgYW5ndWxhci5lbGVtZW50KCRkb2N1bWVudFswXS5xdWVyeVNlbGVjdG9yKCcubWFpbi1tb2RhbCcpKSA6IHVuZGVmaW5lZDtcblxuICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXV0aE1vZGFsLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnYXV0aEN0cmwnLFxuICAgICAgICBjb250cm9sbGVyQXM6ICckYXV0aCcsXG4gICAgICAgIGFwcGVuZFRvOiBwYXJlbnRFbGVtLFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5vbkxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGF1dGgubG9nb3V0KCk7XG4gICAgICAkbG9jYXRpb24ucGF0aCgnZGFzaGJvYXJkLnZpZXcnKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuc3luY1dpZGdldHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkZHNoQnJkLndpZGdldHNMZyA9ICRzY29wZS53aWRnZXRzO1xuICAgICAgJGRzaEJyZC53aWRnZXRzU20gPSAkc2NvcGUud2lkZ2V0cztcbiAgICAgICRkc2hCcmQuc2F2ZVdpZGdldHMoKTtcbiAgICAgICRsb2NhdGlvbi5wYXRoKCdkYXNoYm9hcmQudmlldycpO1xuICAgIH1cblxuICAgICRzY29wZS5yZXNldFdpZGdldHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGVja1NjcmVlblNpemUoKTtcblxuICAgICAgYXBpRGF0YS5nZXREZWZhdWx0R3JpZCgpXG4gICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkZWZhdWx0R3JpZCkge1xuICAgICAgICAgIGRlZmF1bHRHcmlkID0gYW5ndWxhci5mcm9tSnNvbihkZWZhdWx0R3JpZCk7XG4gICAgICAgICAgJHNjb3BlLndpZGdldHMgPSBkZWZhdWx0R3JpZDtcbiAgICAgICAgICBpZiAoJGRzaEJyZC5zY3JlZW5TaXplID09ICdsZycpIHtcbiAgICAgICAgICAgICRkc2hCcmQud2lkZ2V0c0xnID0gZGVmYXVsdEdyaWQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRkc2hCcmQud2lkZ2V0c1NtID0gZGVmYXVsdEdyaWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRkc2hCcmQuc2F2ZVdpZGdldHMoKTtcbiAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnZGFzaGJvYXJkLnZpZXcnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNsZWFyR3JpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRzY29wZS53aWRnZXRzID0gW107XG4gICAgICBpZiAoJGRzaEJyZC5zY3JlZW5TaXplID09ICdsZycpIHtcbiAgICAgICAgJGRzaEJyZC53aWRnZXRzTGcgPSBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRkc2hCcmQud2lkZ2V0c1NtID0gW107XG4gICAgICB9XG4gICAgICAkZHNoQnJkLnNhdmVXaWRnZXRzKCk7XG4gICAgICAkbG9jYXRpb24ucGF0aCgnZGFzaGJvYXJkLnZpZXcnKTtcbiAgICB9XG5cbiAgICB2YXIgcmVzaXplQnJlYWtzID0ge1xuICAgICAgJ3NtJyA6IDUwMFxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBpbnB1dFNjcmVlblNpemUod2lkdGgpIHtcbiAgICAgIGlmICh3aWR0aCA+IDUwMCkge1xuICAgICAgICByZXR1cm4gJ2xnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnc20nO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvZ0l0KHR5cGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVHlwZTpcIiwgdHlwZSk7XG4gICAgfVxuXG4gICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLmJpbmQoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBvbGRXaWR0aCA9ICRkc2hCcmQuY3VycmVudFdpZHRoO1xuICAgICAgdmFyIG9sZFNpemUgPSAkZHNoQnJkLmxhc3RTY3JlZW5TaXplO1xuICAgICAgdmFyIG5ld1dpZHRoID0gJHdpbmRvdy5vdXRlcldpZHRoO1xuICAgICAgdmFyIG5ld1NpemUgPSBpbnB1dFNjcmVlblNpemUobmV3V2lkdGgpO1xuXG4gICAgICBpZiAob2xkU2l6ZSAhPT0gbmV3U2l6ZSkge1xuICAgICAgICAkbG9jYXRpb24ucGF0aCgnZGFzaGJvYXJkLnZpZXcnKTtcbiAgICAgIH1cblxuICAgICAgJGRzaEJyZC5sYXN0U2NyZWVuU2l6ZSA9IG5ld1NpemU7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUubG9nSXQgPSBmdW5jdGlvbiAod2lkZ2V0KSB7XG4gICAgICBjb25zb2xlLmxvZyh3aWRnZXQpO1xuICAgIH1cblxuICB9O1xufSkoKTtcblxuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCduZXJ2ZUNlbnRlcicpXG4gICAgLmRpcmVjdGl2ZSgnY2xvY2tXaWRnZXQnLCBjbG9ja1dpZGdldCk7XG5cbiAgZnVuY3Rpb24gY2xvY2tXaWRnZXQoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQUVDJyxcbiAgICAgIHRlbXBsYXRlVXJsOiBmdW5jdGlvbiAoZWxlbSwgYXR0cnMpIHtcbiAgICAgICAgcmV0dXJuIFwiL2Rhc2hib2FyZC93aWRnZXRUZW1wbGF0ZXMvY2xvY2std2lkZ2V0LnRlbXBsYXRlLmh0bWxcIjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59KSgpO1xuXG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ25lcnZlQ2VudGVyJylcbiAgICAuZGlyZWN0aXZlKCdyZW5kZXJXaWRnZXQnLCByZW5kZXJXaWRnZXQpO1xuXG4gIGZ1bmN0aW9uIHJlbmRlcldpZGdldCgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBRUMnLFxuICAgICAgdGVtcGxhdGVVcmw6IGZ1bmN0aW9uIChlbGVtLCBhdHRycykge1xuICAgICAgICBjb25zb2xlLmxvZyhhdHRycyk7XG4gICAgICAgIHJldHVybiBcIi9kYXNoYm9hcmQvd2lkZ2V0VGVtcGxhdGVzL1wiICsgYXR0cnMudHlwZSArXCIudGVtcGxhdGUuaHRtbFwiO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pKCk7XG5cblxuKGZ1bmN0aW9uICgpIHtcblxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnbmVydmVDZW50ZXInKVxuICAgIC5kaXJlY3RpdmUoJ3Njcm9sbHknLCBzY3JvbGx5KTtcblxuICBmdW5jdGlvbiBzY3JvbGx5KCR3aW5kb3cpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBRUMnLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICB2YXIgcmF3ID0gZWxlbWVudFswXTtcbiAgICAgICAgY29uc29sZS5sb2coJ2xvYWRpbmcgZGlyZWN0aXZlJyk7XG5cbiAgICAgICAgZWxlbWVudC5iaW5kKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2luIHNjcm9sbCcpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHJhdy5zY3JvbGxUb3AgKyByYXcub2Zmc2V0SGVpZ2h0KTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhyYXcuc2Nyb2xsSGVpZ2h0KTtcbiAgICAgICAgICBpZiAocmF3LnNjcm9sbFRvcCArIHJhdy5vZmZzZXRIZWlnaHQgPiByYXcuc2Nyb2xsSGVpZ2h0KSB7XG4gICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMuc2Nyb2xseSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vIHJldHVybiB7XG4gICAgICAvLyAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAvLyAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgLy8gICAgIHZhciByYXcgPSBlbGVtZW50WzBdO1xuXG4gICAgICAvLyAgICAgZWxlbWVudC5iaW5kKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyAgICAgICAvLyB2YXIgeVBvc2l0aW9uID0gcmF3LnNjcm9sbFRvcCArIHJhdy5vZmZzZXRIZWlnaHQ7XG4gICAgICAvLyAgICAgICAvLyBpZiAoeVBvc2l0aW9uID4gc2NvcGUubGFzdFlQb3NpdGlvbikge1xuICAgICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnaW4gc2Nyb2xsJyk7XG4gICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKHJhdy5zY3JvbGxUb3AgKyByYXcub2Zmc2V0SGVpZ2h0KTtcbiAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2cocmF3LnNjcm9sbEhlaWdodCk7XG4gICAgICAvLyAgICAgICAvLyB9XG4gICAgICAvLyAgICAgICBzY29wZS5sYXN0WVBvc2l0aW9uID0geVBvc2l0aW9uO1xuICAgICAgLy8gICAgIH0pO1xuICAgICAgLy8gICB9XG4gICAgICAvLyB9O1xuICAgIH07XG4gICAgfTtcbiAgfSk7XG5cblxuKGZ1bmN0aW9uICgpIHtcblxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnbmVydmVDZW50ZXInKVxuICAgIC5kaXJlY3RpdmUoJ3NlbGVjdFRleHQnLCBzZWxlY3RUZXh0KTtcblxuICBmdW5jdGlvbiBzZWxlY3RUZXh0KCR3aW5kb3cpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHNlbGVjdGlvbiA9ICR3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7ICAgICAgICBcbiAgICAgICAgICB2YXIgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhlbGVtZW50WzBdKTtcbiAgICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgc2VsZWN0aW9uLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbn0pKCk7XG5cblxuKGZ1bmN0aW9uICgpIHtcblxuICBhbmd1bGFyXG4gICAgLm1vZHVsZSgnbmVydmVDZW50ZXInKVxuICAgIC5zZXJ2aWNlKCdhcGlEYXRhJywgYXBpRGF0YSk7XG5cbiAgYXBpRGF0YS4kaW5qZWN0ID0gWyckaHR0cCcsICdhdXRoJ107XG4gIGZ1bmN0aW9uIGFwaURhdGEoJGh0dHAsIGF1dGgpIHtcblxuICAgIHZhciBnZXRQcm9maWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS91c2VyJywge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnKyBhdXRoLmdldFRva2VuKClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGVXaWRnZXRzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuICRodHRwLnB1dCgnL2FwaS91c2VyJywgZGF0YSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnKyBhdXRoLmdldFRva2VuKClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBnZXRJY29ucyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvaWNvJywgZGF0YSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnKyBhdXRoLmdldFRva2VuKClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBnZXREZWZhdWx0R3JpZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2RlZmF1bHRncmlkJywgZGF0YSwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnKyBhdXRoLmdldFRva2VuKClcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBnZXRQcm9maWxlIDogZ2V0UHJvZmlsZSxcbiAgICAgIHVwZGF0ZVdpZGdldHM6IHVwZGF0ZVdpZGdldHMsXG4gICAgICBnZXRJY29uczogZ2V0SWNvbnMsXG4gICAgICBnZXREZWZhdWx0R3JpZDogZ2V0RGVmYXVsdEdyaWRcbiAgICB9O1xuXG4gIH1cblxufSkoKTtcblxuXG52YXIgYWxsSWNvbnMgPSBbXG4gIHsgaWNvbjpcImltZy9CTksucG5nXCIgfSxcbiAgeyBpY29uOlwiaW1nL0NOTi5wbmdcIiB9LFxuICB7IGljb246XCJpbWcvRHJpdmUucG5nXCIgfSxcbiAgeyBpY29uOlwiaW1nL0ZyZWVQcmVzcy5wbmdcIiB9LFxuICB7IGljb246XCJpbWcvR2l0SHViLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9Hb29nbGUucG5nXCIgfSxcbiAgeyBpY29uOlwiaW1nL0ltYWdlLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9JbmRlZWQucG5nXCIgfSxcbiAgeyBpY29uOlwiaW1nL0xhdW5jaC5wbmdcIiB9LFxuICB7IGljb246XCJpbWcvTGlua2VkLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9Ob3Rlcy5wbmdcIiB9LFxuICB7IGljb246XCJpbWcvUmVhZExhdGVyLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9SVG9ycmVudC5wbmdcIiB9LFxuICB7IGljb246XCJpbWcvU2xhY2sucG5nXCIgfSxcbiAgeyBpY29uOlwiaW1nL1RhcGUucG5nXCIgfSxcbiAgeyBpY29uOlwiaW1nL1RyZW5kLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9UdWJlLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9Ud2l0dGVyLnBuZ1wiIH0sXG4gIHsgaWNvbjpcImltZy9XaWtpLnBuZ1wiIH1cbl07XG5cbnZhciBncmlkT3B0aW9ucyA9IHtcbiAgY29sdW1uczogNyxcbiAgcHVzaGluZzogdHJ1ZSxcbiAgZmxvYXRpbmc6IHRydWUsXG4gIHN3YXBwaW5nOiB0cnVlLFxuICB3aWR0aDogJ2F1dG8nLFxuICBjb2xXaWR0aDogJ2F1dG8nLFxuICByb3dIZWlnaHQ6ICdtYXRjaCcsXG4gIG1hcmdpbnM6IFsxMCwgMTBdLFxuICBvdXRlck1hcmdpbjogdHJ1ZSxcbiAgc3BhcnNlOiBmYWxzZSxcbiAgaXNNb2JpbGU6IGZhbHNlLFxuICBtb2JpbGVCcmVha1BvaW50OiA2MDAsXG4gIG1vYmlsZU1vZGVFbmFibGVkOiBmYWxzZSxcbiAgZGVmYXVsdFNpemVYOiAxLFxuICBkZWZhdWx0U2l6ZVk6IDEsXG4gIHJlc2l6YWJsZToge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICB9LFxuICBkcmFnZ2FibGU6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBzdG9wOiBmdW5jdGlvbihldmVudCwgJGVsZW1lbnQsIHdpZGdldCkge1xuICAgICAgY29uc29sZS5sb2coJGVsZW1lbnQuc2NvcGUoKS5ncmlkc3Rlci5ncmlkKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50LnNjb3BlKCkuZ3JpZHN0ZXIuZ3JpZCk7XG4gICAgfVxuICB9XG59O1xuXG5cbnZhciBncmlkc3Rlck1vZGFsT3B0aW9ucyA9IHtcbiAgY29sdW1uczogNixcbiAgcHVzaGluZzogdHJ1ZSxcbiAgZmxvYXRpbmc6IHRydWUsXG4gIHN3YXBwaW5nOiB0cnVlLFxuICB3aWR0aDogJ2F1dG8nLFxuICBjb2xXaWR0aDogJ2F1dG8nLFxuICByb3dIZWlnaHQ6ICdtYXRjaCcsXG4gIG1hcmdpbnM6IFsxMCwgMTBdLFxuICBvdXRlck1hcmdpbjogdHJ1ZSxcbiAgc3BhcnNlOiBmYWxzZSxcbiAgaXNNb2JpbGU6IGZhbHNlLFxuICBtb2JpbGVCcmVha1BvaW50OiA2MDAsXG4gIG1vYmlsZU1vZGVFbmFibGVkOiBmYWxzZSxcbiAgbWluQ29sdW1uczogMSxcbiAgbWluUm93czogMSxcbiAgbWF4Um93czogMTAwLFxuICBkZWZhdWx0U2l6ZVg6IDEsXG4gIGRlZmF1bHRTaXplWTogMSxcbiAgbWluU2l6ZVg6IDEsXG4gIG1heFNpemVYOiBudWxsLFxuICBtaW5TaXplWTogMSxcbiAgbWF4U2l6ZVk6IG51bGwsXG4gIHJlc2l6YWJsZToge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGhhbmRsZXM6IFsnbicsICdlJywgJ3MnLCAndycsICduZScsICdzZScsICdzdycsICdudyddLFxuICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgJGVsZW1lbnQsIHdpZGdldCkge30sXG4gICAgcmVzaXplOiBmdW5jdGlvbihldmVudCwgJGVsZW1lbnQsIHdpZGdldCkge30sXG4gICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsICRlbGVtZW50LCB3aWRnZXQpIHt9XG4gIH0sXG4gIGRyYWdnYWJsZToge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGhhbmRsZTogJy5teS1jbGFzcycsXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50LCAkZWxlbWVudCwgd2lkZ2V0KSB7fSxcbiAgICBkcmFnOiBmdW5jdGlvbihldmVudCwgJGVsZW1lbnQsIHdpZGdldCkge30sXG4gICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsICRlbGVtZW50LCB3aWRnZXQpIHt9XG4gIH1cbn07XG5cblxudmFyIGNhbGNHcmlkT3B0aW9ucyA9IHtcbiAgY29sdW1uczogNixcbiAgcHVzaGluZzogdHJ1ZSxcbiAgZmxvYXRpbmc6IHRydWUsXG4gIHN3YXBwaW5nOiB0cnVlLFxuICB3aWR0aDogJ2F1dG8nLFxuICBjb2xXaWR0aDogJ2F1dG8nLFxuICByb3dIZWlnaHQ6ICdtYXRjaCcsXG4gIG1hcmdpbnM6IFs5LCA5XSxcbiAgb3V0ZXJNYXJnaW46IHRydWUsXG4gIHNwYXJzZTogZmFsc2UsXG4gIGlzTW9iaWxlOiBmYWxzZSxcbiAgbW9iaWxlQnJlYWtQb2ludDogNjAwLFxuICBtb2JpbGVNb2RlRW5hYmxlZDogZmFsc2UsXG4gIGRlZmF1bHRTaXplWDogMSxcbiAgZGVmYXVsdFNpemVZOiAxLFxuICByZXNpemFibGU6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgfSxcbiAgZHJhZ2dhYmxlOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgc3RvcDogZnVuY3Rpb24oZXZlbnQsICRlbGVtZW50LCB3aWRnZXQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCRlbGVtZW50LnNjb3BlKCkuZ3JpZHN0ZXIuZ3JpZCk7XG4gICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudC5zY29wZSgpLmdyaWRzdGVyLmdyaWQpO1xuICAgIH1cbiAgfVxufTtcblxuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCduZXJ2ZUNlbnRlcicpXG4gICAgLmZhY3RvcnkoJ25jQ2FsY0J1dHRvbnMnLCBuY0NhbGNCdXR0b25zKTtcblxuICBmdW5jdGlvbiBuY0NhbGNCdXR0b25zKCkge1xuICAgIHZhciBmYWN0b3J5ID0ge307XG5cbiAgICBmYWN0b3J5LmRpZ2l0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBidXR0b25LZXlzID0gWyBcbiAgICAgICAgJzcnLCc4JywnOScsJzAnLCdjJywnPC0nLFxuICAgICAgICAnNCcsJzUnLCc2JywnLicsJy0nLCcrJyxcbiAgICAgICAgJzEnLCcyJywnMycsJz0nLCcvJywnKidcbiAgICAgIF07XG5cbiAgICAgIHZhciBsZW4gPSBidXR0b25LZXlzLmxlbmd0aCAtIDE7XG5cbiAgICAgIHZhciBpO1xuICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8PSBsZW47IGkrKykge1xuICAgICAgICBuZXdPYmogPSB7fTtcbiAgICAgICAgbmV3T2JqLmtleSA9IGJ1dHRvbktleXNbaV07XG4gICAgICAgIG5ld09iai5jb2wgPSBNYXRoLmZsb29yKChpKzEpLzYpO1xuICAgICAgICBuZXdPYmoucm93ID0gaSAtICg2ICogbmV3T2JqLmNvbCk7XG4gICAgICAgIGJ1dHRvbnMucHVzaChuZXdPYmopO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYnV0dG9ucztcbiAgICB9XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH1cblxufSkoKTtcblxuXG4oZnVuY3Rpb24gKCkge1xuXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCduZXJ2ZUNlbnRlcicpXG4gICAgLmNvbnRyb2xsZXIoJ25jQ2FsY0N0cmwnLCBuY0NhbGNDdHJsKTtcblxuICBmdW5jdGlvbiBuY0NhbGNDdHJsKCRzY29wZSwgbmNDYWxjQnV0dG9ucykge1xuICAgICRzY29wZS5vdXQgPSAnJztcbiAgICAkc2NvcGUucmVzdWx0ID0gMDtcbiAgICAkc2NvcGUuY2FsY0dyaWRPcHRpb25zID0gY2FsY0dyaWRPcHRpb25zO1xuXG4gICAgJHNjb3BlLmRpc3BsYXkgPSBmdW5jdGlvbiAobnVtYmVyKSB7XG5cbiAgICAgIGlmICgkc2NvcGUub3V0ICE9ICd1bmRlZmluZWQnXG4gICAgICAgICAgICYmIG51bWJlciAhPSAnPSdcbiAgICAgICAgICAgJiYgbnVtYmVyICE9ICdjJ1xuICAgICAgICAgICAmJiBudW1iZXIgIT0gJzwtJykge1xuICAgICAgICAkc2NvcGUub3V0ID0gJHNjb3BlLm91dCtudW1iZXI7XG4gICAgICB9XG5cbiAgICAgIGlmICgkc2NvcGUuY2FsaW5wdXQgIT0gJycpIHtcbiAgICAgICAgc3dpdGNoIChudW1iZXIpIHtcblxuICAgICAgICAgIGNhc2UgJ2MnOlxuICAgICAgICAgICAgLy9DYW5jZWxcbiAgICAgICAgICAgIC8vcmVzZXRzIGRpc3BsYXlcbiAgICAgICAgICAgICRzY29wZS5vdXQgPSAnJztcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnPC0nOlxuICAgICAgICAgICAgLy9CYWNrc3BhY2VcbiAgICAgICAgICAgICRzY29wZS5vdXQgPSAgJHNjb3BlLm91dC5zbGljZSgwLCAtMSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJz0nOlxuICAgICAgICAgICAgLy9DYWxjdWxhdGVcbiAgICAgICAgICAgIGlmKCRzY29wZS5jaGVja3N5bWJvbCgkc2NvcGUub3V0KSl7XG4gICAgICAgICAgICAgICRzY29wZS5vdXQgPSBldmFsKCRzY29wZS5vdXQpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogXG4gICAgQ2hlY2sgd2hldGhlciB0aGUgc3RyaW5nIGNvbnRhaW5zIGEgcmVzdHJpY3RlZCBjaGFyYXRlclxuICAgIGluIGZpcnN0IG9yIGxhc3QgcG9zdGlvblxuICAgIEBwYXJhbSBzdHJpbmcgbnVtYmVyXG4gICAgKi9cbiAgICAkc2NvcGUuY2hlY2tzeW1ib2wgPSBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICB2YXIgbm90YWxsb3cgPSBbJysnLCctJywnLycsJyonLCcuJywnJ107XG4gICAgICBpZiAobm90YWxsb3cuaW5kZXhPZihudW1iZXIuc2xpY2UoLTEpKT4gLTEgfHwgbm90YWxsb3cuaW5kZXhPZihudW1iZXIuc2xpY2UoMCwxKSk+LTEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy9TZXQgdGhlIGtleWJvYXJkIHZhbHVlcyB1c2luZyB0aGUgZmFjdG9yeSBtZXRob2QuICBcbiAgICAkc2NvcGUubXlrZXlzID0gbmNDYWxjQnV0dG9ucy5kaWdpdHMoKTtcblxuICB9XG59KSgpO1xuXG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgYW5ndWxhclxuICAgIC5tb2R1bGUoJ25lcnZlQ2VudGVyJylcbiAgICAuZGlyZWN0aXZlKCduY0NhbGMnLCBuY0NhbGMpO1xuXG4gIGZ1bmN0aW9uIG5jQ2FsYygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBRUMnLFxuICAgICAgY29udHJvbGxlcjogJ25jQ2FsY0N0cmwnLFxuICAgICAgdGVtcGxhdGVVcmw6ICcvZGFzaGJvYXJkL25jLWNhbGMvbmMtY2FsYy50ZW1wbGF0ZS5odG1sJ1xuICAgICAgLy8gdGVtcGxhdGU6ICc8ZGl2ICBjbGFzcz1cImNhbGN1bGF0b3JcIj4nXG4gICAgICAvLyAgICAgICAgICAgKyc8ZGl2IGNsYXNzPVwidTQgZGlzcGxheVwiPidcbiAgICAgIC8vICAgICAgICAgICArJzxkaXYgY2xhc3M9XCJkaXNwbGF5LWlubmVyXCI+e3tvdXR9fTwvZGl2PidcbiAgICAgIC8vICAgICAgICAgICArJzwvZGl2PidcbiAgICAgIC8vICAgICAgICAgICArJzxidXR0b24gbmctcmVwZWF0PVwiY2Fsa2V5IGluIG15a2V5cyB0cmFjayBieSAkaW5kZXhcIiBuZy1jbGljaz1cImRpc3BsYXkoY2Fsa2V5KVwiICdcbiAgICAgIC8vICAgICAgICAgICArJ25nLWNsYXNzPVwie1xcJ3UyXFwnOiBjYWxrZXkgPT0gXFwnMFxcJyB8fCBjYWxrZXkgPT0gXFwnPC1cXCcsIFxcJ2J1dHRvbi1ibHVlXFwnIDogY2Fsa2V5ID09IFxcJz1cXCcgLCBcXCdidXR0b24tcmVkXFwnIDogY2Fsa2V5ID09IFxcJ2NcXCcgfVwiJ1xuICAgICAgLy8gICAgICAgICAgICsnY2xhc3M9XCJ1MSBidXR0b24gYnV0dG9uLWdyYXlcIiA+J1xuICAgICAgLy8gICAgICAgICAgICsnPGRpdiBuZy1pZj1cImNhbGtleSE9XFwnPC1cXCdcIj57e2NhbGtleX19PC9kaXY+J1xuICAgICAgLy8gICAgICAgICAgICsnPGRpdiBuZy1pZj1cImNhbGtleT09XFwnPC1cXCdcIj5CPC9kaXY+J1xuICAgICAgLy8gICAgICAgICAgICsnPC9idXR0b24+J1xuICAgICAgLy8gICAgICAgICAgICsnPC9kaXY+J1xuICAgICAgLy8gICAgICAgICAgICsnPC9kaXY+J1xuICAgIH1cbiAgfVxufSkoKTtcblxuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAubWluLmpzLm1hcFxuIl19