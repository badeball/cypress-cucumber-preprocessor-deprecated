Feature: https://github.com/TheBrainFamily/cypress-cucumber-preprocessor/issues/553
  Scenario:
    Given a file named "cypress/integration/features/backend/Testbackend.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a 1st step
          And a 2nd step
      """
    And a file named "cypress/integration/step_definitions/common/commonSteps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 1st step", function() {});
      """
    And a file named "cypress/integration/step_definitions/Testbackend/Testbackend.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 2nd step", function() {});
      """
    And additional preprocessor configuration
      """
      {
        "stepDefinitions": [
          "cypress/integration/step_definitions/common/*.js",
          "cypress/integration/step_definitions/[filename]/*.js"
        ]
      }
      """
    When I run cypress
    Then it passes
