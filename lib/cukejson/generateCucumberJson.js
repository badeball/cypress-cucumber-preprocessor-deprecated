const { EventEmitter } = require("events");
const { JsonFormatter, formatterHelpers } = require("cucumber");
const { messages } = require("cucumber-messages");
const { generateEvents } = require("../parserHelpers");

async function generateCucumberJson(state) {
  let output = "";
  const logFn = data => {
    output += data;
  };

  const eventBroadcaster = new EventEmitter();

  // eslint-disable-next-line no-new
  new JsonFormatter({
    cwd: process.cwd(),
    eventBroadcaster,
    eventDataCollector: new formatterHelpers.EventDataCollector(
      eventBroadcaster
    ),
    log: logFn
  });

  const pickles = [];

  eventBroadcaster.on("envelope", envelope => {
    if (envelope.pickle) {
      pickles.push(envelope);
    }
  });

  // Start feeding the recorded test run into the JsonFormatter

  // Feed in the static test structure
  (await generateEvents(state.spec.toString(), state.uri)).forEach(event => {
    eventBroadcaster.emit("envelope", event);
  });

  // Feed in the results from the recorded scenarios and steps
  Object.keys(state.runTests).forEach((test, testIdx) => {
    const scenario = state.runScenarios[test];
    const stepResults = state.runTests[test];
    const { pickle } = pickles.find(envolope =>
      envolope.pickle.astNodeIds.includes(scenario.id)
    );

    eventBroadcaster.emit(
      "envelope",
      messages.Envelope.fromObject({
        testCase: {
          id: testIdx,
          pickleId: pickle.id,
          testSteps: pickle.steps.map((step, stepIdx) => ({
            id: stepIdx,
            pickleStepId: step.id
          })),
          stepDefinitionIds: []
        }
      })
    );

    eventBroadcaster.emit(
      "envelope",
      messages.Envelope.fromObject({
        testCaseStarted: {
          attempt: 1,
          id: testIdx,
          testCaseId: testIdx
        }
      })
    );

    stepResults.forEach((stepResult, stepIdx) => {
      eventBroadcaster.emit(
        "envelope",
        messages.Envelope.fromObject({
          testStepStarted: {
            testCaseStartedId: testIdx,
            testStepId: stepIdx
          }
        })
      );

      const testResult =
        typeof stepResult.duration === "number"
          ? {
              duration: {
                seconds: stepResult.duration / 1000
              },
              status: stepResult.status
            }
          : {
              status: stepResult.status
            };

      eventBroadcaster.emit(
        "envelope",
        messages.Envelope.fromObject({
          testStepFinished: {
            testCaseStartedId: testIdx,
            testStepId: stepIdx,
            testResult
          }
        })
      );

      if (stepResult.attachment) {
        eventBroadcaster.emit("envelope", stepResult.attachment);
      }
    });

    eventBroadcaster.emit(
      "envelope",
      messages.Envelope.fromObject({
        testCaseFinished: {
          testCaseStartedId: testIdx,
          testResult: {
            status: state.runTests[scenario.name].result
          }
        }
      })
    );
  });

  eventBroadcaster.emit(
    "envelope",
    messages.Envelope.fromObject({
      testRunFinished: {}
    })
  );

  return JSON.parse(output);
}

module.exports = { generateCucumberJson };
