'use strict';

describe('Service: CoachFactory', function () {

  // load the service's module
  beforeEach(module('ptproAppApp'));

  // instantiate service
  var CoachFactory;
  beforeEach(inject(function (_CoachFactory_) {
    CoachFactory = _CoachFactory_;
  }));

  it('should do something', function () {
    expect(!!CoachFactory).toBe(true);
  });

});
