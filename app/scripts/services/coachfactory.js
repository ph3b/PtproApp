'use strict';

/**
 * @ngdoc service
 * @name ptproAppApp.CoachFactory
 * @description
 * # CoachFactory
 * Factory in the ptproAppApp.
 */
angular.module('ptproAppApp')
  .factory('CoachFactory', function ($http, $q, apibase) {
    // Service logic
    // ...

    var meaningOfLife = 42;

    // Public API here
    return {
      updateCoach: function (_coach) {
        var deferred = $q.defer();
        $http.put(apibase + 'coach',_coach).success(function(response){
            deferred.resolve(response)
        });
          return deferred.promise;
      }
    };
  });
