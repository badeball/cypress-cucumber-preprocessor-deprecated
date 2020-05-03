function findFeature(events) {
  const {
    document: { feature }
  } = events.find(event => event.type === "gherkin-document");

  return feature;
}

function findPickles(events) {
  return events
    .filter(event => event.type === "pickle")
    .map(({ pickle }) => pickle);
}

module.exports = { findFeature, findPickles };
