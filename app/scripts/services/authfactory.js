'use strict';

/**
 * @ngdoc service
 * @name ptproAppApp.AuthFactory
 * @description
 * # AuthFactory
 * Factory in the ptproAppApp.
 */
angular.module('ptproAppApp')
  .factory('AuthFactory', function (apibase, $q, $http) {
    // Public API here
    return {
      login : function(userCreds){
        var deferred = $q.defer();
        $http.post(apibase + 'login', userCreds)
        .success(function(response) {
          deferred.resolve(response);
        }).error(function(msg, code){
          deferred.resolve(code);
          
        });
        return deferred.promise;
      },
      getUser: function(){
          var deferred = $q.defer();
          $http.get(apibase + 'user').success(function(user){
              deferred.resolve(user)
          });
          return deferred.promise;
      }
    }
  });
