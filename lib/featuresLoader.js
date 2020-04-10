const glob = require("glob");
const path = require("path");
const fs = require("fs");
const log = require("debug")("cypress:cucumber");
const jsStringEscape = require("js-string-escape");
const { parse } = require("./parserHelpers");

const { getStepDefinitionsPaths } = require("./getStepDefinitionsPaths");
const { cucumberTemplate } = require("./cucumberTemplate");
const { getCucumberJsonConfig } = require("./getCucumberJsonConfig");
const {
  isNonGlobalStepDefinitionsMode
} = require("./isNonGlobalStepDefinitionsMode");

const createCucumber = (
  sources,
  features,
  globalToRequire,
  nonGlobalToRequire,
  cucumberJson
) =>
  `
    ${cucumberTemplate}
  window.cucumberJson = ${JSON.stringify(cucumberJson)};

  var moduleCache = arguments[5];

  // Stolen from https://github.com/browserify/browserify/issues/1444
  function clearFromCache(instance)
  {
      for(var key in moduleCache)
      {
          if(moduleCache[key].exports == instance)
          {
              delete moduleCache[key];
              return;
          }
      }
      throw "could not clear instance from module cache";
  }

  ${globalToRequire.join("\n")}

  ${sources
    .map(
      ({ source, filePath }, i) => `
        describe(\`${features[i].name}\`, function() {
        window.currentFeatureName = \`${features[i].name}\`
        ${nonGlobalToRequire &&
          nonGlobalToRequire
            .find(fileSteps => fileSteps[filePath])
            [filePath].join("\n")}
            
        createTestsFromFeature('${path.basename(filePath)}', \`${jsStringEscape(
        source
      )}\`, ${JSON.stringify(features[i])});
        })
        `
    )
    .join("\n")}
  `;

module.exports = function(_, filePath = this.resourcePath) {
  log("compiling", filePath);

  const featuresPaths = glob.sync(`${path.dirname(filePath)}/**/*.feature`);

  let globalStepDefinitionsToRequire = [];
  let nonGlobalStepDefinitionsToRequire;

  if (isNonGlobalStepDefinitionsMode()) {
    nonGlobalStepDefinitionsToRequire = featuresPaths.map(featurePath => ({
      [featurePath]: getStepDefinitionsPaths(featurePath).map(
        sdPath => `clearFromCache(require('${sdPath}'))`
      )
    }));
  } else {
    globalStepDefinitionsToRequire = [
      ...new Set(
        featuresPaths.reduce(
          requires =>
            requires.concat(
              getStepDefinitionsPaths(filePath).map(
                sdPath => `require('${sdPath}')`
              )
            ),
          []
        )
      )
    ];
  }

  const sources = featuresPaths.map(featurePath => ({
    source: fs.readFileSync(featurePath).toString(),
    filePath: featurePath
  }));

  const features = sources
    .map(({ source }) => parse(source))
    .map(({ feature }) => feature);

  return createCucumber(
    sources,
    features,
    globalStepDefinitionsToRequire,
    nonGlobalStepDefinitionsToRequire,
    getCucumberJsonConfig()
  );
};
