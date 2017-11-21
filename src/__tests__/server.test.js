const Server = require('../server');

jest.mock('express');

describe('server', () => {
  test('start', () => {
    console.log();
    expect(1).toBe(1);
  })

});