const { CucumberDataCollector } = require("./cukejson/cucumberDataCollector");
const { createTestFromScenarios } = require("./createTestFromScenario");
const { shouldProceedCurrentStep, getEnvTags } = require("./tagsHelper");

const flatten = collection =>
  collection.reduce((acum, element) => [].concat(acum).concat(element));

const createTestsFromFeature = (filePath, source, feature, pickles) => {
  const testState = new CucumberDataCollector(filePath, source, feature);
  const envTags = getEnvTags();

  let tagFilter = null;

  const tagsUsedInTests = flatten(pickles.map(pickle => pickle.tags)).map(
    tag => tag.name
  );

  if (tagsUsedInTests.includes("@focus")) {
    tagFilter = "@focus";
  } else if (envTags) {
    tagFilter = envTags;
  }

  const picklesToRun = pickles.filter(
    pickle => !tagFilter || shouldProceedCurrentStep(pickle.tags, tagFilter)
  );

  createTestFromScenarios(picklesToRun, testState);
};

module.exports = {
  createTestsFromFeature
};
