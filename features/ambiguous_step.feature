Feature: ambiguous steps

  Scenario: two steps matching the same text
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature name
        Scenario: a scenario name
          Given a ambiguous step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      When(/^a ambiguous step$/, function() {});
      When(/^a .* step$/, function() {});
      """
    When I run cypress
    Then it fails
    And the output should contain
      """
      Multiple implementations exists for: a ambiguous step
      """
