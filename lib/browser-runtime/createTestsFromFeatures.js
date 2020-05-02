const DataTable = require("cucumber/lib/models/data_table").default;
const statuses = require("cucumber/lib/status").default;
const { CucumberDataCollector } = require("./cukejson/cucumberDataCollector");
const { generateCucumberJson } = require("./cukejson/generateCucumberJson");
const { shouldProceedCurrentStep } = require("./tagsHelper");
const createRegitries = require("./createRegistries");
const populateGlobalMethods = require("./populateGlobalMethods");

function resolveAndRunHooks(hookRegistry, scenarioTags, featureName) {
  return window.Cypress.Promise.each(
    hookRegistry.resolve(scenarioTags, featureName),
    ({ implementation }) => implementation.call(this)
  );
}

function resolveStepArgument(args) {
  const [argument] = args;
  if (!argument) {
    return argument;
  }
  if (argument.rows) {
    return new DataTable(argument);
  }
  if (argument.content) {
    return argument.content;
  }
  return argument;
}

function resolveAndRunStepDefinition(
  stepDefinitionRegistry,
  step,
  featureName
) {
  const stepText = step.text;
  const { expression, implementation } = stepDefinitionRegistry.resolve(
    stepText,
    featureName
  );
  const argument = resolveStepArgument(step.arguments);
  return implementation.call(
    this,
    ...expression.match(stepText).map(match => match.getValue()),
    argument
  );
}

const cleanupFilename = s => s.split(".")[0];

const writeCucumberJsonFile = (json, preprocessorConfig) => {
  const outputFolder =
    preprocessorConfig.cucumberJson.outputFolder || "cypress/cucumber-json";
  const outputPrefix = preprocessorConfig.cucumberJson.filePrefix || "";
  const outputSuffix =
    preprocessorConfig.cucumberJson.fileSuffix || ".cucumber";
  const fileName = json[0] ? cleanupFilename(json[0].uri) : "empty";
  const outFile = `${outputFolder}/${outputPrefix}${fileName}${outputSuffix}.json`;
  cy.writeFile(outFile, json, { log: false });
};

function createTestsFromFeatures(options) {
  const { features, preprocessorConfig, globalFilesToRequireFn } = options;

  const tagsUsedInTests = features
    .flatMap(feature => feature.pickles)
    .flatMap(pickle => pickle.tags)
    .map(tag => tag.name);

  const envTags = Cypress.env("TAGS");

  let tagFilter = null;

  if (tagsUsedInTests.includes("@focus")) {
    tagFilter = "@focus";
  } else if (envTags) {
    tagFilter = envTags;
  }

  let stepDefinitionRegistry;
  let beforeHookRegistry;
  let afterHookRegistry;

  if (globalFilesToRequireFn) {
    ({
      stepDefinitionRegistry,
      beforeHookRegistry,
      afterHookRegistry
    } = createRegitries());

    populateGlobalMethods({
      stepDefinitionRegistry,
      beforeHookRegistry,
      afterHookRegistry
    });

    globalFilesToRequireFn();
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const {
    filePath,
    source,
    feature,
    pickles,
    localFilesToRequireFn
  } of features) {
    const testState = new CucumberDataCollector(filePath, source, feature);

    if (localFilesToRequireFn) {
      ({
        stepDefinitionRegistry,
        beforeHookRegistry,
        afterHookRegistry
      } = createRegitries());

      populateGlobalMethods({
        stepDefinitionRegistry,
        beforeHookRegistry,
        afterHookRegistry
      });

      localFilesToRequireFn();
    }

    // eslint-disable-next-line no-loop-func
    describe(feature.name, () => {
      before(() => {
        cy.then(() => testState.onStartTest());
      });

      beforeEach(() => {
        /**
         * Left for legacy support, but it's not something we rely on (nor should you).
         */
        window.testState = testState;

        const failHandler = err => {
          Cypress.off("fail", failHandler);
          testState.onFail(err);
          throw err;
        };

        Cypress.on("fail", failHandler);
      });

      const picklesToRun = pickles.filter(
        pickle => !tagFilter || shouldProceedCurrentStep(pickle.tags, tagFilter)
      );

      picklesToRun.forEach(pickle => {
        const indexedSteps = pickle.steps.map((step, index) =>
          Object.assign({}, step, { index })
        );

        it(pickle.name, function() {
          return cy
            .then(() => testState.onStartScenario(pickle, indexedSteps))
            .then(() =>
              resolveAndRunHooks.call(
                this,
                beforeHookRegistry,
                pickle.tags,
                feature.name
              )
            )
            .then(() =>
              indexedSteps.forEach(step => {
                cy.then(() => testState.onStartStep(step))
                  .then(() =>
                    resolveAndRunStepDefinition.call(
                      this,
                      stepDefinitionRegistry,
                      step,
                      testState.feature.name
                    )
                  )
                  .then(() => testState.onFinishStep(step, statuses.PASSED));
              })
            )
            .then(() =>
              resolveAndRunHooks.call(
                this,
                afterHookRegistry,
                pickle.tags,
                feature.name
              )
            )
            .then(() => testState.onFinishScenario(pickle));
        });
      });

      after(() => {
        cy.then(() => testState.onFinishTest()).then(() => {
          if (
            preprocessorConfig &&
            preprocessorConfig.cucumberJson &&
            preprocessorConfig.cucumberJson.generate
          ) {
            const json = generateCucumberJson(testState);
            writeCucumberJsonFile(json, preprocessorConfig);
          }
        });
      });
    });
  }
}

module.exports = createTestsFromFeatures;
