Feature: https://github.com/TheBrainFamily/cypress-cucumber-preprocessor/issues/619
  Scenario:
    Given a file named "cypress/integration/moduleA/A.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a 1st step
          And a 2nd step
      """
    And a file named "cypress/integration/common/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 1st step", function() {});
      """
    And a file named "cypress/integration/moduleA/common/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 2nd step", function() {});
      """
    And a file named "cypress/integration/moduleA/A/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 3rd step", function() {});
      """
    And additional preprocessor configuration
      """
      {
        "stepDefinitions": [
          "cypress/integration/common/*.js",
          "cypress/integration/[filepart]/common/*.js",
          "cypress/integration/[filepart]/*.js"
        ]
      }
      """
    When I run cypress
    Then it passes
