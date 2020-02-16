/* eslint-disable prefer-template */
const statuses = require("cucumber").Status;
const {
  resolveAndRunStepDefinition,
  resolveAndRunBeforeHooks,
  resolveAndRunAfterHooks
} = require("./resolveStepDefinition");
const flatten = require("./flatten");

const replaceParameterTags = (rowData, text) =>
  Object.keys(rowData).reduce(
    (value, key) => value.replace(new RegExp(`<${key}>`, "g"), rowData[key]),
    text
  );

// eslint-disable-next-line func-names
const stepTest = function(state, stepDetails, exampleRowData) {
  cy.then(() => state.onStartStep(stepDetails))
    .then(() =>
      resolveAndRunStepDefinition.call(
        this,
        stepDetails,
        replaceParameterTags,
        exampleRowData,
        state.feature.name
      )
    )
    .then(() => state.onFinishStep(stepDetails, statuses.PASSED));
};

const runTest = (scenario, stepsToRun, rowData) => {
  const indexedSteps = stepsToRun.map((step, index) =>
    Object.assign({}, step, { index })
  );

  // eslint-disable-next-line func-names
  it(scenario.name, function() {
    const state = window.testState;
    return cy
      .then(() => state.onStartScenario(scenario, indexedSteps))
      .then(() =>
        resolveAndRunBeforeHooks.call(this, scenario.tags, state.feature.name)
      )
      .then(() =>
        indexedSteps.forEach(step => stepTest.call(this, state, step, rowData))
      )
      .then(() =>
        resolveAndRunAfterHooks.call(this, scenario.tags, state.feature.name)
      )
      .then(() => state.onFinishScenario(scenario));
  });
};

const createTestFromScenario = (
  scenario,
  backgrounds
) => {
  if (scenario.examples) {
    scenario.examples.forEach(example => {
      const exampleValues = [];
      const exampleLocations = [];

      example.tableBody.forEach((row, rowIndex) => {
        exampleLocations[rowIndex] = row.location;
        example.tableHeader.cells.forEach((header, headerIndex) => {
          exampleValues[rowIndex] = Object.assign(
            {},
            exampleValues[rowIndex],
            {
              [header.value]: row.cells[headerIndex].value
            }
          );
        });
      });

      exampleValues.forEach((rowData, index) => {
        // eslint-disable-next-line prefer-arrow-callback
        const scenarioName = replaceParameterTags(rowData, scenario.name);
        const uniqueScenarioName = `${scenarioName} (example #${index + 1})`;
        const exampleSteps = scenario.steps.map(step => {
          const newStep = Object.assign({}, step);
          newStep.text = replaceParameterTags(rowData, newStep.text);
          return newStep;
        });

        const stepsToRun = flatten(backgrounds.map(background => background.steps)).concat(exampleSteps);

        const scenarioExample = Object.assign({}, scenario, {
          name: uniqueScenarioName,
          example: exampleLocations[index]
        });

        runTest.call(this, scenarioExample, stepsToRun, rowData);
      });
    });
  } else {
    const stepsToRun = flatten(backgrounds.map(background => background.steps)).concat(scenario.steps);

    runTest.call(this, scenario, stepsToRun);
  }
};

module.exports = {
  createTestFromScenario
};
