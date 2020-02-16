const { CucumberDataCollector } = require("./cukejson/cucumberDataCollector");
const { createTestFromScenario } = require("./createTestFromScenario");
const { shouldProceedCurrentStep, getEnvTags } = require("./tagsHelper");
const { generateCucumberJson } = require("./cukejson/generateCucumberJson");
const flatten = require("./flatten");

function collectTags (node) {
  const ownTags = node.tags ? node.tags.map(tag => tag.name) : [];

  if (node.children) {
    return ownTags.concat(flatten(node.children.map(collectTags)));
  } else if (node.rule) {
    return ownTags.concat(collectTags(node.rule));
  } else if (node.scenario) {
    return ownTags.concat(collectTags(node.scenario));
  } else{
    return ownTags;
  }
}

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

const createTestsFromFeature = (filePath, spec, feature) => {
  const testState = new CucumberDataCollector(filePath, spec, feature);
  const envTags = getEnvTags();

  let tagFilter = null;

  if (collectTags(feature).includes("@focus")) {
    tagFilter = "@focus";
  } else if (!!envTags) {
    tagFilter = envTags;
  }

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

  // eslint-disable-next-line func-names, prefer-arrow-callback
  after(function() {
    cy.then(() => testState.onFinishTest()).then(() => {
      if (window.cucumberJson && window.cucumberJson.generate) {
        return generateCucumberJson(testState).then(writeCucumberJsonFile);
      }

      return null;
    });
  });

  const backgrounds = feature.children.filter(child => child.background).map(child => child.background);

  for (let child of feature.children) {
    if (!child.background) {
      visitNode(child, backgrounds, feature.tags || [], tagFilter);
    }
  }
};

function visitNode (node, inheritedBackgrounds, inheritedTags, tagFilter) {
  if (node.rule) {
    describe(node.rule.name, () => {
      const backgrounds = node.rule.children.filter(child => child.background).map(child => child.background);

      for (let child of node.rule.children) {
        if (!child.background) {
          visitNode(child, inheritedBackgrounds.concat(backgrounds), inheritedTags, tagFilter);
        }
      }
    });
  } else if (node.scenario) {
    const ownTags = node.scenario.tags ? inheritedTags.concat(node.scenario.tags) : inheritedTags;

    if (!tagFilter || shouldProceedCurrentStep(ownTags, tagFilter)) {
      createTestFromScenario(node.scenario, inheritedBackgrounds);
    }
  }
}

module.exports = {
  createTestsFromFeature
};
