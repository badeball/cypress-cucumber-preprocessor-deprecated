Feature: hooks ordering

  Hooks should be executed in the following order:
   - before
   - beforeEach
   - Before
   - Background steps
   - Ordinary steps
   - After
   - afterEach
   - after

  Scenario: with all hooks incrementing a counter
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
      let counter;
      before(function() {
        counter = 0;
      })
      beforeEach(function() {
        assert.equal(counter++, 0, "Expected beforeEach() to be called after before()")
      })
      Before(function() {
        assert.equal(counter++, 1, "Expected Before() to be called after beforeEach()")
      })
      Given("a background step", function() {
        assert.equal(counter++, 2, "Expected a background step to be called after Before()")
      })
      Given("an ordinary step", function() {
        assert.equal(counter++, 3, "Expected an ordinary step to be called after a background step")
      })
      After(function() {
        assert.equal(counter++, 4, "Expected After() to be called after ordinary steps")
      })
      afterEach(function() {
        assert.equal(counter++, 5, "Expected afterEach() to be called after After()")
      })
      after(function() {
        assert.equal(counter++, 6, "Expected after() to be called after afterEach()")
      })
      """
    When I run cypress
    Then it passes
