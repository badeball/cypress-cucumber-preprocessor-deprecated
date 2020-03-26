Feature: ambiguous keyword

  Scenario: wrongly keyworded step matching
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      When("a step", function() {});
      """
    When I run cypress
    Then it passes
