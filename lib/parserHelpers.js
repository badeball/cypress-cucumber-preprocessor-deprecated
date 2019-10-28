const { generateEvents: origGenerateEvents, Parser } = require("gherkin");

async function parse(spec) {
  return new Parser().parse(spec);
}

async function generateEvents(...args) {
  return origGenerateEvents(...args);
}

module.exports = { generateEvents, parse };
