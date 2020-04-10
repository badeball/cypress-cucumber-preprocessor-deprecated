const { generateEvents, Parser } = require("gherkin");

function parse(source) {
  return new Parser().parse(source);
}

module.exports = { generateEvents, parse };
