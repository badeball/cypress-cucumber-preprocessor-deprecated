Feature: target specific scenario

  Background:
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: some feature
        @a
        Scenario: first scenario
          Given a step
        @b
        Scenario Outline: second scenario - <ID>
          Given a step
          @c
          Examples:
            | ID |
            | X  |
            | Y  |
          @d
          Examples:
            | ID |
            | Z  |
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a step", function() {})
      """

  Scenario: run a single scenario
    When I run cypress with "--env TAGS=@a"
    Then it passes
    And it should appear to have run the scenario "first scenario"

  Scenario: filter out scenarios with ~
    When I run cypress with "--env 'TAGS=not @b'"
    Then it passes
    And it should appear to have run the scenario "first scenario"

  Scenario: run a single scenario outline
    When I run cypress with "--env TAGS=@b"
    Then it passes
    And it should appear to have run the scenarios
      | Name                             |
      | second scenario - X (example #1) |
      | second scenario - Y (example #2) |
      | second scenario - Z (example #3) |

  Scenario: run a single scenario outline examples
    When I run cypress with "--env TAGS=@d"
    Then it passes
    And it should appear to have run the scenarios
      | Name                             |
      | second scenario - Z (example #3) |
