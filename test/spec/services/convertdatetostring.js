'use strict';

describe('Service: convertDateToString', function () {

  // load the service's module
  beforeEach(module('ptproAppApp'));

  // instantiate service
  var convertDateToString;
  beforeEach(inject(function (_convertDateToString_) {
    convertDateToString = _convertDateToString_;
  }));

  it('should do something', function () {
    expect(!!convertDateToString).toBe(true);
  });

});
