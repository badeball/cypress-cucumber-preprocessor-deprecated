const log = require("debug")("cypress:cucumber");
const path = require("path");
const jsStringEscape = require("js-string-escape");
const { parse } = require("./parserHelpers");
const { getStepDefinitionsPaths } = require("./getStepDefinitionsPaths");
const { getConfig } = require("./getConfig");

// This is the template for the file that we will send back to cypress instead of the text of a
// feature file
const createCucumber = (filePath, source, feature, pickles, toRequire) =>
  `
    const {
      createTestsFromFeatures
    } = require("${path.join(__dirname, "browser-runtime")}");

    createTestsFromFeatures({
      features: [{
        filePath: ${JSON.stringify(filePath)},
        source: '${jsStringEscape(source)}',
        feature: ${JSON.stringify(feature)},
        pickles: ${JSON.stringify(pickles)},
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

  const { feature, pickles } = parse(source.toString());

  return createCucumber(
    path.basename(filePath),
    source,
    feature,
    pickles,
    stepDefinitionsToRequire
  );
};
