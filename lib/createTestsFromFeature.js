const { CucumberDataCollector } = require("./cukejson/cucumberDataCollector");
const { createTestFromScenarios } = require("./createTestFromScenario");
const { shouldProceedCurrentStep, getEnvTags } = require("./tagsHelper");

const section = child => child.background || child.scenario;

const createTestsFromFeature = (filePath, spec, feature) => {
  const testState = new CucumberDataCollector(filePath, spec, feature);
  const featureTags = testState.feature.tags;
  const hasEnvTags = !!getEnvTags();
  const sectionsWithTags = testState.feature.children.filter(
    child => section(child).tags && section(child).tags.length
  );

  const sectionsWithTagsExist = sectionsWithTags.length > 0;

  let everythingShouldRun = false;
  let featureShouldRun = false;
  let taggedScenarioShouldRun = false;
  let anyFocused = false;
  if (hasEnvTags) {
    featureShouldRun = shouldProceedCurrentStep(featureTags);
    taggedScenarioShouldRun = testState.feature.children.some(
      child =>
        section(child).tags &&
        section(child).tags.length &&
        shouldProceedCurrentStep(section(child).tags.concat(featureTags))
    );
  } else if (!sectionsWithTagsExist) {
    everythingShouldRun = true;
  } else {
    anyFocused = sectionsWithTags.some(child =>
      section(child).tags.find(t => t.name === "@focus")
    );
    if (anyFocused) {
      taggedScenarioShouldRun = true;
    } else {
      everythingShouldRun = true;
    }
  }

  // eslint-disable-next-line prefer-arrow-callback
  if (everythingShouldRun || featureShouldRun || taggedScenarioShouldRun) {
    const backgroundSection = testState.feature.children.find(
      child => !!child.background
    );
    const otherSections = testState.feature.children.filter(
      child => !child.background
    );
    const scenariosToRun = otherSections.filter(({ scenario }) => {
      let shouldRun;
      if (anyFocused) {
        shouldRun =
          scenario.tags && scenario.tags.find(t => t.name === "@focus");
      } else {
        shouldRun =
          everythingShouldRun ||
          shouldProceedCurrentStep(scenario.tags.concat(featureTags)); // Concat handles inheritance of tags from feature
      }
      return shouldRun;
    });
    createTestFromScenarios(scenariosToRun, backgroundSection, testState);
  }
};

module.exports = {
  createTestsFromFeature
};
