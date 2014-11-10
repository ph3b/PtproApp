'use strict';

describe('Controller: CustomersIdCtrl', function () {

  // load the controller's module
  beforeEach(module('ptproAppApp'));

  var CustomersIdCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CustomersIdCtrl = $controller('CustomersIdCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
