const log = require("debug")("cypress:cucumber");
const path = require("path");
const { generateEvents } = require("./parserHelpers");
const { getStepDefinitionsPaths } = require("./getStepDefinitionsPaths");
const { getConfig } = require("./getConfig");

// This is the template for the file that we will send back to cypress instead of the text of a
// feature file
const createCucumber = (filePath, events, toRequire) =>
  `
    const {
      createTestsFromFeatures
    } = require("cypress-cucumber-preprocessor/dist/browser-runtime");

    createTestsFromFeatures({
      features: [{
        filePath: ${JSON.stringify(filePath)},
        events: ${JSON.stringify(events)},
        localFilesToRequireFn() {
          ${toRequire.join("\n")}
        }
      }],
      preprocessorConfig: ${JSON.stringify(getConfig())}
    });
  `;

// eslint-disable-next-line func-names
module.exports = function(source, filePath = this.resourcePath) {
  log("compiling", source);
  const stepDefinitionsToRequire = getStepDefinitionsPaths(filePath).map(
    sdPath => `require('${sdPath}')`
  );

  const events = generateEvents(source.toString(), path.basename(filePath));

  return createCucumber(
    path.basename(filePath),
    events,
    stepDefinitionsToRequire
  );
};
