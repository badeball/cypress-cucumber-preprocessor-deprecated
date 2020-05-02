global.jestExpect = global.expect;
global.expect = require("chai").expect;

window.Cypress = {
  env: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  log: jest.fn(),
  Promise: { each: (iterator, iteree) => iterator.map(iteree) }
};
