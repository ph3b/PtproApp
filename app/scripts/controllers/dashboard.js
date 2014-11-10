'use strict';

/**
 * @ngdoc function
 * @name ptproAppApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the ptproAppApp
 */
angular.module('ptproAppApp')
  .controller('DashboardCtrl', function ($scope) {
        $scope.mode = 'week';

        var startDate = new Date();
        var endDate = new Date();
        startDate.setHours(21);
        startDate.setMinutes(0);
        endDate.setHours(22);
        endDate.setMinutes(0);


        $scope.eventSource = [
            {title: 'Mathias Iden', startTime : startDate, endTime: endDate}
        ];

  });
