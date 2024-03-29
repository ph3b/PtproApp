'use strict';

describe('Controller: CustomersCtrl', function () {

  // load the controller's module
  beforeEach(module('ptproAppApp'));

  var CustomersCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CustomersCtrl = $controller('CustomersCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
