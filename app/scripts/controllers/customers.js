'use strict';

/**
 * @ngdoc function
 * @name ptproAppApp.controller:CustomersCtrl
 * @description
 * # CustomersCtrl
 * Controller of the ptproAppApp
 */
angular.module('ptproAppApp')
  .controller('CustomersCtrl', function ($scope, CustomerFactory, $location, convertDateToString) {
        $scope.viewDidLoad = false;
    $scope.newCustomer = function(a){
	    	CustomerFactory.newCustomer($scope.customer).then(function(response){
	    		getCustomer();
    		});
    		$scope.customer = "";
    	};

    	var getCustomer = function(){
    		CustomerFactory.getCustomer().then(function(response){
    			$scope.customers = response;
                $scope.viewDidLoad = true;
    		})
    	};
    	getCustomer();
        $scope.goToCustomer = function(id){
            $location.url('/customers/' + id);
        };
        $scope.convertDateToSimpleString = convertDateToString;
  });
