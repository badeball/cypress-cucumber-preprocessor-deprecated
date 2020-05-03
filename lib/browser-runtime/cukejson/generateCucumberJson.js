const { EventEmitter } = require("events");
const JsonFormatter = require("cucumber/lib/formatter/json_formatter").default;
const formatterHelpers = require("cucumber/lib/formatter/helpers");

function last(collection) {
  return collection[collection.length - 1];
}

function generateCucumberJson(state) {
  let output = "";
  const logFn = data => {
    output += data;
  };

  const eventBroadcaster = new EventEmitter();

  function storePickle({ pickle, uri }) {
    eventBroadcaster.emit("pickle-accepted", { pickle, uri });
  }

  eventBroadcaster.on("pickle", storePickle);

  // eslint-disable-next-line no-new
  new JsonFormatter({
    eventBroadcaster,
    eventDataCollector: new formatterHelpers.EventDataCollector(
      eventBroadcaster
    ),
    log: logFn
  });

  // Start feeding the recorded test run into the JsonFormatter

  // Feed in the static test structure
  state.events.forEach(event => {
    eventBroadcaster.emit(event.type, event);
  });

  // Feed in the results from the recorded scenarios and steps
  Object.keys(state.runTests).forEach(test => {
    const pickle = state.runPickles[test];
    const stepResults = state.runTests[test];
    const stepsToRun = state.scenarioSteps[test];
    const steps = stepsToRun.map(step => ({
      sourceLocation: { uri: state.uri, line: last(step.locations).line }
    }));
    eventBroadcaster.emit("test-case-prepared", {
      sourceLocation: state.formatTestCase(pickle).sourceLocation,
      steps
    });
    stepResults.forEach((stepResult, stepIdx) => {
      eventBroadcaster.emit("test-step-prepared", {
        index: stepIdx,
        testCase: state.formatTestCase(pickle)
      });
      eventBroadcaster.emit("test-step-finished", {
        index: stepIdx,
        testCase: state.formatTestCase(pickle),
        result: stepResult
      });
      if (stepResult.attachment) {
        eventBroadcaster.emit("test-step-attachment", stepResult.attachment);
      }
    });
    eventBroadcaster.emit("test-case-finished", {
      sourceLocation: state.formatTestCase(pickle).sourceLocation,
      result: state.runTests[pickle.name].result
    });
  });
  eventBroadcaster.emit("test-run-finished", {});

  return JSON.parse(output);
}

module.exports = { generateCucumberJson };
