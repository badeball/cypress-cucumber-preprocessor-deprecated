const log = require("debug")("cypress:cucumber");
const path = require("path");
const jsStringEscape = require("js-string-escape");
const { parse } = require("./parserHelpers");
const { getStepDefinitionsPaths } = require("./getStepDefinitionsPaths");
const { cucumberTemplate } = require("./cucumberTemplate");
const { getCucumberJsonConfig } = require("./getCucumberJsonConfig");

// This is the template for the file that we will send back to cypress instead of the text of a
// feature file
const createCucumber = (
  filePath,
  cucumberJson,
  source,
  feature,
  pickles,
  toRequire
) =>
  `
  ${cucumberTemplate}
  
  window.cucumberJson = ${JSON.stringify(cucumberJson)};
  describe(\`${feature.name}\`, function() {
    ${toRequire.join("\n")}
    createTestsFromFeature('${filePath}', \`${jsStringEscape(
    source
  )}\`, ${JSON.stringify(feature)}, ${JSON.stringify(pickles)});
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
    getCucumberJsonConfig(),
    source,
    feature,
    pickles,
    stepDefinitionsToRequire
  );
};
