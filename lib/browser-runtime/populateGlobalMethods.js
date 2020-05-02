const {
  defineParameterType
} = require("cucumber/lib/support_code_library_builder/define_helpers");

function parseHookArgs(args) {
  if (args.length === 2) {
    if (typeof args[0] !== "object" || typeof args[0].tags !== "string") {
      throw new Error(
        "Hook definitions with two arguments should have an object containing tags (string) as the first argument."
      );
    }
    if (typeof args[1] !== "function") {
      throw new Error(
        "Hook definitions with two arguments must have a function as the second argument."
      );
    }
    return {
      tags: args[0].tags,
      implementation: args[1]
    };
  }
  if (typeof args[0] !== "function") {
    throw new Error(
      "Hook definitions with one argument must have a function as the first argument."
    );
  }
  return {
    implementation: args[0]
  };
}

/* eslint-disable no-param-reassign, no-multi-assign */
function populateGlobalMethods(
  { stepDefinitionRegistry, beforeHookRegistry, afterHookRegistry },
  instance = window
) {
  const defineStep = (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  };

  instance.defineStep = defineStep;
  instance.Given = instance.given = defineStep;
  instance.When = instance.when = defineStep;
  instance.Then = instance.then = defineStep;
  instance.And = instance.and = defineStep;
  instance.But = instance.but = defineStep;

  instance.defineParameterType = defineParameterType(stepDefinitionRegistry);

  instance.Before = (...args) => {
    const { tags, implementation } = parseHookArgs(args);
    beforeHookRegistry.runtime(tags, implementation);
  };

  instance.After = (...args) => {
    const { tags, implementation } = parseHookArgs(args);
    afterHookRegistry.runtime(tags, implementation);
  };
}
/* eslint-enable no-param-reassign, no-multi-assign */

module.exports = populateGlobalMethods;
