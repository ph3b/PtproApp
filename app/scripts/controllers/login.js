'use strict';

/**
 * @ngdoc function
 * @name ptproAppApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the ptproAppApp
 */
angular.module('ptproAppApp')
  .controller('LoginCtrl', function ($scope, AuthFactory, $location) {
    $scope.login = function(){
    	console.log($scope.user)
   			AuthFactory.login($scope.user).then(function(response){
   				if(response == 401){
   					$scope.error = 'Feil brukernavn eller passord'
   				}
   				else {
   					$location.url('/dashboard')
   				}
   			})
   		}
    AuthFactory.getUser().then(function(response){
        if(response != '0'){
            $location.url('/dashboard')
        }
    })
  });
