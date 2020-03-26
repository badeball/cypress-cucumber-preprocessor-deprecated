Feature: tagged Hooks

  Background:
    Given a file named "cypress/support/step_definitions/steps.js" with:
      """
      const assert = require("assert")
      Then("{word} is true", function(prop) {
        assert.equal(true, this[prop])
      })
      Then("{word} is false", function(prop) {
        assert.equal(false, this[prop])
      })
      """
    And a file named "cypress/support/step_definitions/hooks.js" with:
      """
      const {
        Before
      } = require("cypress-cucumber-preprocessor/steps");
      Before(function() {
        this.foo = false
        this.bar = false
      })
      Before({ tags: "@foo" }, function() {
        this.foo = true
      })
      Before({ tags: "@bar" }, function() {
        this.bar = true
      })
      """

  Scenario: hooks filtered by tags on scenario
    Given a file named "cypress/integration/a.feature" with:
      """
      Feature:
        @foo
        Scenario:
          Then foo is true
          And bar is false
      """
    When I run cypress
    Then it passes

  Scenario: tags cascade from feature to scenario
    Given a file named "cypress/integration/a.feature" with:
      """
      @foo
      Feature:
        Scenario:
          Then foo is true
          And bar is false
      """
    When I run cypress
    Then it passes
