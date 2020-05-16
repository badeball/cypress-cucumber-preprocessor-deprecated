function memoize(fn) {
  let isRun = false, result;

  return function (...args) {
    if (!isRun) {
      result = fn(...args);
      isRun = true;
    }

    return result;
  }
}

const constructLocationMap = memoize(function (feature) {
  return feature.children.reduce((map, child) => {
    const { line, column } = child.location;
    map[`${line}-${column}`] = child;
    return map;
  }, {})
})

function findScenarioByLocation(feature, { line, column }) {
  return constructLocationMap(feature)[`${line}-${column}`];
}

function findScenarioByPickle(feature, pickle) {
  const location = pickle.locations[pickle.locations.length - 1];
  return findScenarioByLocation(feature, location);
}

module.exports = { findScenarioByPickle };
