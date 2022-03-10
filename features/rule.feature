Feature: rule
  Scenario: a scenario inside a rule
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature name
        Rule: a rule
          Scenario: a scenario name
            Given a step
      """
    And a file named "cypress/integration/a.js" with:
      """
      const { Given } = require("@badeball/cypress-cucumber-preprocessor/methods");
      Given("a step", function() {});
      """
    When I run cypress
    Then it passes
