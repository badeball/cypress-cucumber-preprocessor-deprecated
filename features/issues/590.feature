Feature: https://github.com/TheBrainFamily/cypress-cucumber-preprocessor/issues/590
  Scenario:
    Given a file named "cypress/integration/group-1/feature-a.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a 1st step
          And a 2nd step
          And a 3rd step
      """
    And a file named "cypress/integration/group-1/feature-a/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 1st step", function() {});
      """
    And a file named "cypress/integration/group-1/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 2nd step", function() {});
      """
    And a file named "cypress/integration/steps.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a 3rd step", function() {});
      """
    And additional preprocessor configuration
      """
      {
        "stepDefinitions": "cypress/integration/[filepart]/*.js"
      }
      """
    When I run cypress
    Then it passes
