const fs = require("fs");
const statuses = require("../../../vendor/cucumber-js/lib/status").default;
const { CucumberDataCollector } = require("./cucumberDataCollector");
const { generateCucumberJson } = require("./generateCucumberJson");
const { generateEvents } = require("../../parserHelpers");

window.cucumberJson = { generate: true };

const assertCucumberJson = (json, expectedResults) => {
  expect(json).to.have.length(1);
  expect(json[0].keyword).to.eql("Feature");
  expect(json[0].name).to.eql("Being a plugin");
  expect(json[0].elements).to.have.length(1);
  expect(json[0].elements[0].keyword).to.eql("Scenario");
  expect(json[0].elements[0].name).to.eql("Basic example");
  expect(json[0].elements[0].steps).to.have.length(3);
  expect(json[0].elements[0].steps[0].keyword).to.equal("Given ");
  expect(json[0].elements[0].steps[0].name).to.equal(
    "a feature and a matching step definition file"
  );
  // eslint-disable-next-line no-unused-expressions
  expect(json[0].elements[0].steps[0].result).to.be.not.null;
  expect(json[0].elements[0].steps[0].result.status).to.eql(expectedResults[0]);
  expect(json[0].elements[0].steps[1].keyword).to.equal("When ");
  expect(json[0].elements[0].steps[1].name).to.equal("I run cypress tests");
  // eslint-disable-next-line no-unused-expressions
  expect(json[0].elements[0].steps[1].result).to.be.not.null;
  expect(json[0].elements[0].steps[1].result.status).to.eql(expectedResults[1]);
  expect(json[0].elements[0].steps[2].keyword).to.equal("Then ");
  expect(json[0].elements[0].steps[2].name).to.equal("they run properly");
  // eslint-disable-next-line no-unused-expressions
  expect(json[0].elements[0].steps[2].result).to.be.not.null;
  expect(json[0].elements[0].steps[2].result.status).to.eql(expectedResults[2]);
};
describe("Cucumber Data Collector", () => {
  const pickle = {
    tags: [],
    locations: [{ line: 7, column: 3 }],
    name: "Basic example",
    steps: [
      {
        type: "Step",
        locations: [{ line: 8, column: 5 }],
        keyword: "Given ",
        text: "a feature and a matching step definition file"
      },
      {
        type: "Step",
        locations: [{ line: 9, column: 5 }],
        keyword: "When ",
        text: "I run cypress tests"
      },
      {
        type: "Step",
        locations: [{ line: 10, column: 5 }],
        keyword: "Then ",
        text: "they run properly"
      }
    ]
  };

  const stepsToRun = [
    {
      locations: [{ line: 8, column: 5 }],
      keyword: "Given ",
      text: "a feature and a matching step definition file",
      index: 0
    },
    {
      locations: [{ line: 9, column: 5 }],
      keyword: "When ",
      text: "I run cypress tests",
      index: 1
    },
    {
      locations: [{ line: 10, column: 5 }],
      keyword: "Then ",
      text: "they run properly",
      index: 2
    }
  ];

  beforeEach(async () => {
    const filePath = "./cypress/integration/Plugin.feature";
    const source = fs.readFileSync(filePath);
    this.testState = new CucumberDataCollector(
      filePath,
      await generateEvents(source.toString(), filePath)
    );
    this.testState.onStartTest();
  });

  it("runs", () => {
    this.testState.onFinishTest();
    const json = generateCucumberJson(this.testState);
    expect(json).to.have.length(0);
  });

  it("records pending scenarios", () => {
    this.testState.onStartScenario(pickle, stepsToRun);
    this.testState.onFinishScenario(pickle);
    this.testState.onFinishTest();
    const json = generateCucumberJson(this.testState);
    assertCucumberJson(json, [
      statuses.SKIPPED,
      statuses.SKIPPED,
      statuses.SKIPPED
    ]);
  });
  it("records passed scenarios", () => {
    this.testState.onStartScenario(pickle, stepsToRun);
    this.testState.onStartStep(stepsToRun[0]);
    this.testState.onFinishStep(stepsToRun[0], statuses.PASSED);
    this.testState.onStartStep(stepsToRun[1]);
    this.testState.onFinishStep(stepsToRun[1], statuses.PASSED);
    this.testState.onStartStep(stepsToRun[2]);
    this.testState.onFinishStep(stepsToRun[2], statuses.PASSED);
    this.testState.onFinishScenario(pickle);
    this.testState.onFinishTest();
    const json = generateCucumberJson(this.testState);
    assertCucumberJson(json, [
      statuses.PASSED,
      statuses.PASSED,
      statuses.PASSED
    ]);
  });

  it("records failed scenarios", () => {
    this.testState.onStartScenario(pickle, stepsToRun);
    this.testState.onStartStep(stepsToRun[0]);
    this.testState.onFinishStep(stepsToRun[0], statuses.PASSED);
    this.testState.onStartStep(stepsToRun[1]);
    this.testState.onFinishStep(stepsToRun[1], statuses.FAILED);
    this.testState.onFinishScenario(pickle);
    this.testState.onFinishTest();
    const json = generateCucumberJson(this.testState);
    assertCucumberJson(json, [
      statuses.PASSED,
      statuses.FAILED,
      statuses.SKIPPED
    ]);
  });

  it("handles missing steps", () => {
    this.testState.onStartScenario(pickle, stepsToRun);
    this.testState.onStartStep(stepsToRun[0]);
    this.testState.onFinishStep(stepsToRun[0], statuses.PASSED);
    this.testState.onStartStep(stepsToRun[1]);
    this.testState.onFinishStep(stepsToRun[1], statuses.UNDEFINED);
    this.testState.onFinishScenario(pickle);
    this.testState.onFinishTest();
    const json = generateCucumberJson(this.testState);
    assertCucumberJson(json, [
      statuses.PASSED,
      statuses.UNDEFINED,
      statuses.SKIPPED
    ]);
  });
});
