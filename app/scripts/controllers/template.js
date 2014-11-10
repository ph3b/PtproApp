'use strict';

/**
 * @ngdoc function
 * @name ptproAppApp.controller:TemplateCtrl
 * @description
 * # TemplateCtrl
 * Controller of the ptproAppApp
 */
angular.module('ptproAppApp')
  .controller('TemplateCtrl', function ($scope, $location, AuthFactory) {
    $scope.showLoggedInFeatures = function(){
    	return $location.path() != '/'
    };
    AuthFactory.getUser().then(function(user){
        $scope.user = user;
    });
  });
