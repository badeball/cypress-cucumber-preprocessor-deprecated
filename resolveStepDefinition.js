console.warn(
  "DEPRECATION WARNING! Please change your imports from cypress-cucumber-preprocessor/resolveStepDefinition to cypress-cucumber-preprocessor/steps"
);

module.exports = require("./steps");
