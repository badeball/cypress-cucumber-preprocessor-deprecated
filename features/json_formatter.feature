Feature: JSON formatter

  Background:
    Given additional preprocessor configuration
      """
      {
        "cucumberJson": {
          "generate": true,
          "outputFolder": "json"
        }
      }
      """

  Scenario: gherkin error
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
          Examples:
            | a |
      """
    When I run cypress
    Then it fails
    And there should be no JSON output

  Scenario: undefined step
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given an undefined step
      """
    When I run cypress
    Then it fails
    And there should be a JSON output similar to "fixtures/undefined-step.json"

  Scenario: passed example
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a step", function() {})
      """
    When I run cypress
    Then it passes
    And there should be a JSON output similar to "fixtures/passed-example.json"

  Scenario Outline: passed outline
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a step", function() {})
      """
    When I run cypress
    Then it passes
    And there should be a JSON output similar to "fixtures/passed-outline.json"
    Examples:
      | value |
      | foo   |

  Scenario: failed
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        Scenario: a scenario
          Given a failing step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a failing step", function() {
        throw "some error"
      })
      """
    When I run cypress
    Then it fails
    And there should be a JSON output similar to "fixtures/failed.json"
