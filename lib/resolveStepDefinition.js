const DataTable = require("cucumber/lib/models/data_table").default;
const {
  defineParameterType
} = require("cucumber/lib/support_code_library_builder/define_helpers");
const {
  CucumberExpression,
  RegularExpression,
  ParameterTypeRegistry
} = require("cucumber-expressions");
const { shouldProceedCurrentStep } = require("./tagsHelper");

class StepDefinitionRegistry {
  constructor() {
    this.definitions = {};
    this.runtime = {};
    this.options = {
      parameterTypeRegistry: new ParameterTypeRegistry()
    };

    this.definitions = [];
    this.runtime = (matcher, implementation) => {
      let expression;
      if (matcher instanceof RegExp) {
        expression = new RegularExpression(
          matcher,
          this.options.parameterTypeRegistry
        );
      } else {
        expression = new CucumberExpression(
          matcher,
          this.options.parameterTypeRegistry
        );
      }

      this.definitions.push({
        implementation,
        expression,
        featureName: window.currentFeatureName || "___GLOBAL_EXECUTION___"
      });
    };

    this.resolve = (text, runningFeatureName) => {
      const matchingSteps = this.definitions.filter(
        ({ expression, featureName }) =>
          expression.match(text) &&
          (runningFeatureName === featureName ||
            featureName === "___GLOBAL_EXECUTION___")
      );

      if (matchingSteps.length === 0) {
        throw new Error(`Step implementation missing for: ${text}`);
      } else if (matchingSteps.length > 1) {
        throw new Error(`Multiple implementations exists for: ${text}`);
      } else {
        return matchingSteps[0];
      }
    };
  }
}

class HookRegistry {
  constructor() {
    this.definitions = [];
    this.runtime = {};

    this.runtime = (tags, implementation) => {
      this.definitions.push({
        tags,
        implementation,
        featureName: window.currentFeatureName || "___GLOBAL_EXECUTION___"
      });
    };

    this.resolve = (scenarioTags, runningFeatureName) =>
      this.definitions.filter(
        ({ tags, featureName }) =>
          (!tags ||
            tags.length === 0 ||
            shouldProceedCurrentStep(scenarioTags, tags)) &&
          (runningFeatureName === featureName ||
            featureName === "___GLOBAL_EXECUTION___")
      );
  }
}

const stepDefinitionRegistry = new StepDefinitionRegistry();
const beforeHookRegistry = new HookRegistry();
const afterHookRegistry = new HookRegistry();

function resolveStepDefinition(step, featureName) {
  const stepDefinition = stepDefinitionRegistry.resolve(step.text, featureName);
  return stepDefinition || {};
}

function resolveStepArgument(args) {
  const [argument] = args;
  if (!argument) {
    return argument;
  }
  if (argument.rows) {
    return new DataTable(argument);
  }
  if (argument.content) {
    return argument.content;
  }
  return argument;
}

function resolveAndRunHooks(hookRegistry, scenarioTags, featureName) {
  return window.Cypress.Promise.each(
    hookRegistry.resolve(scenarioTags, featureName),
    ({ implementation }) => implementation.call(this)
  );
}

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

module.exports = {
  resolveAndRunBeforeHooks(scenarioTags, featureName) {
    return resolveAndRunHooks.call(
      this,
      beforeHookRegistry,
      scenarioTags,
      featureName
    );
  },
  resolveAndRunAfterHooks(scenarioTags, featureName) {
    return resolveAndRunHooks.call(
      this,
      afterHookRegistry,
      scenarioTags,
      featureName
    );
  },
  // eslint-disable-next-line func-names
  resolveAndRunStepDefinition(step, featureName) {
    const { expression, implementation } = resolveStepDefinition(
      step,
      featureName
    );
    const stepText = step.text;
    const argument = resolveStepArgument(step.arguments);
    return implementation.call(
      this,
      ...expression.match(stepText).map(match => match.getValue()),
      argument
    );
  },
  given: (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  },
  when: (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  },
  then: (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  },
  and: (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  },
  but: (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  },
  Before: (...args) => {
    const { tags, implementation } = parseHookArgs(args);
    beforeHookRegistry.runtime(tags, implementation);
  },
  After: (...args) => {
    const { tags, implementation } = parseHookArgs(args);
    afterHookRegistry.runtime(tags, implementation);
  },
  defineStep: (expression, implementation) => {
    stepDefinitionRegistry.runtime(expression, implementation);
  },
  defineParameterType: defineParameterType(stepDefinitionRegistry)
};
