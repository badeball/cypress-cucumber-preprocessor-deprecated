Feature: world

  Scenario: `this` should be availble and equal in all method bodies
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature: a feature
        Background:
          Given a background step
        Scenario: a scenario
          Given an ordinary step
      """
    And a file named "cypress/support/step_definitions/steps.js" with:
      """
      const assert = require("assert")
      const {
        Before,
        After
      } = require("cypress-cucumber-preprocessor/steps")
      function assertValue() {
        assert.equal(this.value, "foobar", "Expected this.value to equal foobar")
      }
      before(function() {
        this.value = "foobar"
      })
      beforeEach(assertValue)
      Before(assertValue)
      Given("a background step", assertValue)
      Given("an ordinary step", assertValue)
      After(assertValue)
      afterEach(assertValue)
      after(assertValue)
      """
    When I run cypress
    Then it passes
