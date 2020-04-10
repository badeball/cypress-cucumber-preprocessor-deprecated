const { generateEvents } = require("gherkin");

function parse(source) {
  const events = generateEvents(source);

  const {
    document: { feature }
  } = events.find(event => event.type === "gherkin-document");

  const pickles = events
    .filter(event => event.type === "pickle")
    .map(({ pickle }) => pickle);

  return { feature, pickles };
}

module.exports = { generateEvents, parse };
