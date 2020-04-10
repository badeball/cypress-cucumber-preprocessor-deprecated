/* eslint-disable prefer-template */
const statuses = require("cucumber/lib/status").default;
const {
  resolveAndRunStepDefinition,
  resolveAndRunBeforeHooks,
  resolveAndRunAfterHooks
} = require("./resolveStepDefinition");
const { generateCucumberJson } = require("./cukejson/generateCucumberJson");

// eslint-disable-next-line func-names
const stepTest = function(state, stepDetails) {
  cy.then(() => state.onStartStep(stepDetails))
    .then(() =>
      resolveAndRunStepDefinition.call(this, stepDetails, state.feature.name)
    )
    .then(() => state.onFinishStep(stepDetails, statuses.PASSED));
};

const runTest = pickle => {
  const indexedSteps = pickle.steps.map((step, index) =>
    Object.assign({}, step, { index })
  );

  // eslint-disable-next-line func-names
  it(pickle.name, function() {
    const state = window.testState;
    return cy
      .then(() => state.onStartScenario(pickle, indexedSteps))
      .then(() =>
        resolveAndRunBeforeHooks.call(this, pickle.tags, state.feature.name)
      )
      .then(() =>
        indexedSteps.forEach(step => stepTest.call(this, state, step))
      )
      .then(() =>
        resolveAndRunAfterHooks.call(this, pickle.tags, state.feature.name)
      )
      .then(() => state.onFinishScenario(pickle));
  });
};

const cleanupFilename = s => s.split(".")[0];

const writeCucumberJsonFile = json => {
  const outputFolder =
    window.cucumberJson.outputFolder || "cypress/cucumber-json";
  const outputPrefix = window.cucumberJson.filePrefix || "";
  const outputSuffix = window.cucumberJson.fileSuffix || ".cucumber";
  const fileName = json[0] ? cleanupFilename(json[0].uri) : "empty";
  const outFile = `${outputFolder}/${outputPrefix}${fileName}${outputSuffix}.json`;
  cy.writeFile(outFile, json, { log: false });
};

const createTestFromPickles = (pickles, testState) => {
  // eslint-disable-next-line func-names, prefer-arrow-callback
  before(function() {
    cy.then(() => testState.onStartTest());
  });

  // ctx is cleared between each 'it'
  // eslint-disable-next-line func-names, prefer-arrow-callback
  beforeEach(function() {
    window.testState = testState;

    const failHandler = err => {
      Cypress.off("fail", failHandler);
      testState.onFail(err);
      throw err;
    };

    Cypress.on("fail", failHandler);
  });

  pickles.forEach(pickle => {
    runTest.call(this, pickle);
  });

  // eslint-disable-next-line func-names, prefer-arrow-callback
  after(function() {
    cy.then(() => testState.onFinishTest()).then(() => {
      if (window.cucumberJson && window.cucumberJson.generate) {
        const json = generateCucumberJson(testState);
        writeCucumberJsonFile(json);
      }
    });
  });
};

module.exports = {
  createTestFromScenarios: createTestFromPickles
};
