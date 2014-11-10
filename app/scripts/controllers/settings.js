'use strict';

/**
 * @ngdoc function
 * @name ptproAppApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the ptproAppApp
 */
angular.module('ptproAppApp')
  .controller('SettingsCtrl', function ($scope, AuthFactory, CoachFactory) {
        $scope.viewDidLoad = false;
        var loadData = function(){
            AuthFactory.getUser().then(function(user){
                $scope.user = user;
                if(!user.firstname){
                    $scope.user.firstname = ''
                }
                if(!user.lastname){
                    $scope.user.lastname = '';
                }
                $scope.viewDidLoad = true
            });
        };

        $scope.profileIsComplete = function(){
            if($scope.user){
                if(!$scope.user.firstname){
                    return false;
                }
                if(!$scope.user.lastname){
                    return false
                }
                return true;
            }
        };
       $scope.updateCoach = function(_coach){
           $scope.viewDidLoad = false;
           CoachFactory.updateCoach(_coach).then(function(res){
                loadData()
           })
       };

        loadData();
  });
