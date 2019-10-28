const log = require("debug")("cypress:cucumber");
const path = require("path");
const jsStringEscape = require("js-string-escape");
const { parse } = require("./parserHelpers");
const { getStepDefinitionsPaths } = require("./getStepDefinitionsPaths");
const { cucumberTemplate } = require("./cucumberTemplate");
const { getCucumberJsonConfig } = require("./getCucumberJsonConfig");

// This is the template for the file that we will send back to cypress instead of the text of a
// feature file
const createCucumber = async (
  filePath,
  cucumberJson,
  spec,
  feature,
  toRequire
) =>
  `
  ${cucumberTemplate}
  
  window.cucumberJson = ${JSON.stringify(cucumberJson)};
  describe(\`${feature.name}\`, function() {
    ${toRequire.join("\n")}
    createTestsFromFeature('${filePath}', \`${jsStringEscape(
    spec
  )}\`, ${JSON.stringify(feature)});
  });
  `;

// eslint-disable-next-line func-names
module.exports = async function(spec, filePath = this.resourcePath) {
  log("compiling", spec);
  const stepDefinitionsToRequire = getStepDefinitionsPaths(filePath).map(
    sdPath => `require('${sdPath}')`
  );

  const feature = await parse(spec.toString(), filePath);

  return createCucumber(
    path.basename(filePath),
    getCucumberJsonConfig(),
    spec,
    feature,
    stepDefinitionsToRequire
  );
};
