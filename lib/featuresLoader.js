const glob = require("glob");
const path = require("path");
const fs = require("fs");
const log = require("debug")("cypress:cucumber");
const { generateEvents } = require("./parserHelpers");

const { getStepDefinitionsPaths } = require("./getStepDefinitionsPaths");
const { getConfig } = require("./getConfig");
const {
  isNonGlobalStepDefinitionsMode
} = require("./isNonGlobalStepDefinitionsMode");

const createCucumber = (
  filePaths,
  eventsCol,
  globalToRequire,
  nonGlobalToRequire
) =>
  `
    var moduleCache = arguments[5];

    // Stolen from https://github.com/browserify/browserify/issues/1444.
    function clearFromCache(instance) {
      for (var key in moduleCache) {
        if (moduleCache[key].exports == instance) {
          delete moduleCache[key];
          return;
        }
      }
      throw "Could not clear instance from module cache.";
    }

    const {
      createTestsFromFeatures
    } = require("cypress-cucumber-preprocessor/dist/browser-runtime");

    createTestsFromFeatures({
      globalFilesToRequireFn: ${
        globalToRequire ? `() => {${globalToRequire.join(";")}}` : "null"
      },
      features: [
        ${filePaths
          .map(
            (filePath, i) => `
            {
              filePath: ${JSON.stringify(filePath)},
              events: ${JSON.stringify(eventsCol[i])},
              localFilesToRequireFn: ${
                globalToRequire
                  ? "null"
                  : `() => {${nonGlobalToRequire[i].join(";")}}`
              }
            }
          `
          )
          .join(",")}
      ],
      preprocessorConfig: ${JSON.stringify(getConfig())}
    });
  `;

module.exports = async function(_, filePath = this.resourcePath) {
  log("compiling", filePath);

  const featuresPaths = glob.sync(`${path.dirname(filePath)}/**/*.feature`);

  let globalStepDefinitionsToRequire;
  let nonGlobalStepDefinitionsToRequire;

  if (isNonGlobalStepDefinitionsMode()) {
    nonGlobalStepDefinitionsToRequire = featuresPaths.map(featurePath =>
      getStepDefinitionsPaths(featurePath).map(
        sdPath => `clearFromCache(require('${sdPath}'))`
      )
    );
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

  const eventsCol = await Promise.all(featuresPaths.map(featurePath =>
    generateEvents(fs.readFileSync(featurePath).toString())
  ));

  return createCucumber(
    featuresPaths,
    eventsCol,
    globalStepDefinitionsToRequire,
    nonGlobalStepDefinitionsToRequire
  );
};
