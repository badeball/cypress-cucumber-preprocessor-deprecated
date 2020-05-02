/* eslint-disable no-param-reassign, no-multi-assign */
function populateGlobalMethods(supportCodeLibraryBuilder, instance = window) {
  const {
    methods: { defineStep, defineParameterType, Before, After }
  } = supportCodeLibraryBuilder;

  instance.defineStep = defineStep;
  instance.Given = instance.given = defineStep;
  instance.When = instance.when = defineStep;
  instance.Then = instance.then = defineStep;
  instance.And = instance.and = defineStep;
  instance.But = instance.but = defineStep;
  instance.defineParameterType = defineParameterType;
  instance.Before = Before;
  instance.After = After;
}
/* eslint-enable no-param-reassign, no-multi-assign */

module.exports = populateGlobalMethods;
