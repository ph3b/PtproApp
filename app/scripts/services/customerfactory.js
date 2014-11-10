'use strict';

/**
 * @ngdoc service
 * @name ptproAppApp.CustomerFactory
 * @description
 * # CustomerFactory
 * Factory in the ptproAppApp.
 */
angular.module('ptproAppApp')
  .factory('CustomerFactory', function (apibase, $http, $q) {
    

    // Public API here
    return {
      newCustomer: function (customer) {
        var deferred = $q.defer();
        $http.post(apibase + 'customer', customer).success(function(response){
          deferred.resolve(response)
        })
        return deferred.promise;
      },
      getCustomer: function(){
        var deferred = $q.defer();
        $http.get(apibase + 'customer').success(function(customers){
          deferred.resolve(customers)
        });
        return deferred.promise;
      },
      getCustomerById: function(id){
          var deferred = $q.defer();
         $http.get(apibase + 'customer/' + id).success(function(customer){
             deferred.resolve(customer)
         });
          return deferred.promise;
      }
    };
  });
