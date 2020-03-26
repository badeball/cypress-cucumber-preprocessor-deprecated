Feature: smart tagging

  Rules:
   - In presence of any @focus tag, only tests tagged with this should be run
   - This behavior is scoped per file

  Scenario: 1 / 2 scenarios tagged with @focus
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        @focus
        Scenario: a scenario
          Given a step

        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear as if only a single test ran

  Scenario: 2 / 2 scenarios tagged with @focus
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        @focus
        Scenario: a scenario
          Given a step

        @focus
        Scenario: another scenario
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear as if both tests ran

  Scenario: one file with @focus, one without
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        @focus
        Scenario: a scenario
          Given a step
      """
    And a file named "cypress/integration/b.feature" with:
      """
      Feature: b feature
        Scenario: another scenario
          Given a step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      Given("a step", function(table) {});
      """
    When I run cypress
    Then it should appear as if both tests ran
