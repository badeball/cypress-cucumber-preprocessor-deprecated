const statuses = require("cucumber/lib/status").default;
const {
  SupportCodeLibraryBuilder
} = require("cucumber/lib/support_code_library_builder");
const { CucumberDataCollector } = require("./cukejson/cucumberDataCollector");
const { generateCucumberJson } = require("./cukejson/generateCucumberJson");
const { shouldProceedCurrentStep } = require("./tagsHelper");
const populateGlobalMethods = require("./populateGlobalMethods");

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

  let supportCodeLibrary;

  if (globalFilesToRequireFn) {
    const supportCodeLibraryBuilder = new SupportCodeLibraryBuilder();
    supportCodeLibraryBuilder.reset(process.cwd());
    populateGlobalMethods(supportCodeLibraryBuilder);
    globalFilesToRequireFn();
    supportCodeLibrary = supportCodeLibraryBuilder.finalize();
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const {
    filePath,
    source,
    feature,
    pickles,
    localFilesToRequireFn
  } of features) {
    const testState = new CucumberDataCollector(filePath, source);

    if (localFilesToRequireFn) {
      const supportCodeLibraryBuilder = new SupportCodeLibraryBuilder();
      supportCodeLibraryBuilder.reset(process.cwd());
      populateGlobalMethods(supportCodeLibraryBuilder);
      localFilesToRequireFn();
      supportCodeLibrary = supportCodeLibraryBuilder.finalize();
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
            .then(() => {
              const matchingBeforeHooks = supportCodeLibrary.beforeTestCaseHookDefinitions.filter(
                hookDefinition =>
                  hookDefinition.appliesToTestCase({ pickle, uri: "foo" })
              );

              return window.Cypress.Promise.each(
                matchingBeforeHooks,
                ({ code }) => code.call(this)
              );
            })
            .then(() => {
              indexedSteps.forEach(step => {
                cy.then(() => testState.onStartStep(step))
                  .then(async () => {
                    const matchingStepDefinitions = supportCodeLibrary.stepDefinitions.filter(
                      stepDefinition =>
                        stepDefinition.matchesStepName({
                          stepName: step.text,
                          parameterTypeRegistry:
                            supportCodeLibrary.parameterTypeRegistry
                        })
                    );

                    if (matchingStepDefinitions.length === 0) {
                      throw new Error(
                        `Step implementation missing for: ${step.text}`
                      );
                    } else if (matchingStepDefinitions.length > 1) {
                      throw new Error(
                        `Multiple implementations exists for: ${step.text}`
                      );
                    }

                    const stepDefinition = matchingStepDefinitions[0];

                    const parameters = await Promise.all(
                      stepDefinition.getInvocationParameters({
                        parameterTypeRegistry:
                          supportCodeLibrary.parameterTypeRegistry,
                        step,
                        world: this
                      })
                    );

                    return stepDefinition.code.apply(this, parameters);
                  })
                  .then(() => testState.onFinishStep(step, statuses.PASSED));
              });
            })
            .then(() => {
              const matchingAfterHooks = supportCodeLibrary.afterTestCaseHookDefinitions.filter(
                hookDefinition =>
                  hookDefinition.appliesToTestCase({ pickle, uri: "foo" })
              );

              return window.Cypress.Promise.each(
                matchingAfterHooks,
                ({ code }) => code.call(this)
              );
            })
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
