const { generateEvents, Parser } = require("gherkin");

function parse(spec) {
  return new Parser().parse(spec);
}

module.exports = { generateEvents, parse };
