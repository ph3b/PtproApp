'use strict';

/**
 * @ngdoc function
 * @name ptproAppApp.controller:CustomersIdCtrl
 * @description
 * # CustomersIdCtrl
 * Controller of the ptproAppApp
 */
angular.module('ptproAppApp')
  .controller('CustomersIdCtrl', function ($scope, $routeParams, CustomerFactory, convertDateToString) {
        $scope.viewDidLoad = false;
        var loadData = function(){
            CustomerFactory.getCustomerById($routeParams.id).then(function(customer){
                $scope.customer = customer;
                $scope.viewDidLoad = true;
            });
        };
        loadData();
        $scope.convertDateToSimpleString = convertDateToString;

  });
