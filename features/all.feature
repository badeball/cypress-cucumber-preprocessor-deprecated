Feature: all.features

  Background:
    Given additional Cypress configuration
      """
      {
        "testFiles": "**/*.{feature,features}"
      }
      """

  Scenario: two features with common step definition
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a step
      """
    And a file named "cypress/integration/b.feature" with:
      """
      Feature: a feature name
        Scenario: another scenario name
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      When("a step", function() {});
      """
    And an empty file named "cypress/integration/all.features"
    When I run cypress with "--spec cypress/integration/all.features"
    Then it passes
    And it should appear to have run the scenarios
      | Name                  |
      | a scenario name       |
      | another scenario name |
    But it should appear as if only a single file was ran

  Scenario: two features with separate, but identical step definitions
    Given additional preprocessor configuration
      """
      {
        "nonGlobalStepDefinitions": true
      }
      """
    And a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a step
      """
    And a file named "cypress/integration/b.feature" with:
      """
      Feature: another feature name
        Scenario: another scenario name
          Given a step
      """
    And a file named "cypress/integration/a/step_definition.js" with:
      """
      Given("a step", function() {});
      """
    And a file named "cypress/integration/b/step_definition.js" with:
      """
      Given("a step", function() {});
      """
    And an empty file named "cypress/integration/all.features"
    When I run cypress with "--spec cypress/integration/all.features"
    Then it passes
    And it should appear to have run the scenarios
      | Name                  |
      | a scenario name       |
      | another scenario name |
    But it should appear as if only a single file was ran
