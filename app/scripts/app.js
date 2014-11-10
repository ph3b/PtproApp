'use strict';

/**
 * @ngdoc overview
 * @name ptproAppApp
 * @description
 * # ptproAppApp
 *
 * Main module of the application.
 */
var ptProApp = angular
  .module('ptproAppApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'angularSpinner',
    'ui.bootstrap',
    'ui.rCalendar'
  ])
  .config(function ($routeProvider, $httpProvider) {
    var apibase = 'http://10.0.1.98:8080/api/';
    $httpProvider.defaults.withCredentials = true;
    var checkLoggedIn = function($q, $timeout, $http, $location, $rootScope){
        var deferred = $q.defer();

        $http.get(apibase + 'userisloggedin').success(function(user){
          if(user !== '0'){
            $timeout(deferred.resolve, 0);
          }
          else {
            $timeout(function(){
              deferred.reject();
            }, 0);
            $location.url('/')
          }
        }).error(function(arg){
            $location.url('/')
        })
      };

    $routeProvider
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        resolve : {
          isAuthenticated : checkLoggedIn
        }
      })
      .when('/', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .when('/dashboard', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve : {
          isAuthenticated : checkLoggedIn
        }
      })
      .when('/customers', {
        templateUrl: 'views/customers.html',
        controller: 'CustomersCtrl',
        resolve : {
          isAuthenticated : checkLoggedIn
        }
      })
      .when('/settings', {
        templateUrl: 'views/settings.html',
        controller: 'SettingsCtrl',
        resolve : {
            isAuthenticated : checkLoggedIn
        }
      })
      .when('/customers/:id', {
        templateUrl: 'views/customers/:id.html',
        controller: 'CustomersIdCtrl',
        resolve : {
            isAuthenticated : checkLoggedIn
        }
      })
      .otherwise({
        redirectTo: '/login'
      });
  });
ptProApp.constant('apibase', 'http://10.0.1.98:8080/api/');