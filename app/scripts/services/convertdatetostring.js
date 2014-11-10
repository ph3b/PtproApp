'use strict';

/**
 * @ngdoc service
 * @name ptproAppApp.convertDateToString
 * @description
 * # convertDateToString
 * Factory in the ptproAppApp.
 */
angular.module('ptproAppApp')
  .factory('convertDateToString', function () {
        var monthlist = [
            'januar',
            'februar',
            'mars',
            'april',
            'mai',
            'juni',
            'juli',
            'august',
            'september',
            'oktober',
            'november',
            'desember'
        ];
    return {
      get: function (inputDate) {
          if(inputDate){ // Fikser feilmeldinger
              var _date = new Date(inputDate);
              var simpleDateString = _date.getDate() + '. ' + monthlist[_date.getMonth()].slice(0, 3) + ' ' + _date.getFullYear();
              return simpleDateString;
          }
      }
    };
  });
