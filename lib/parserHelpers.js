const { generateEvents: origGenerateEvents } = require("gherkin");

async function generateEvents(...args) {
  return origGenerateEvents(...args);
}

module.exports = { generateEvents };
