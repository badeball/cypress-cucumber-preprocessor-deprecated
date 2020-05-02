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
        expression
      });
    };

    this.resolve = text => {
      const matchingSteps = this.definitions.filter(({ expression }) =>
        expression.match(text)
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
        implementation
      });
    };

    this.resolve = scenarioTags =>
      this.definitions.filter(
        ({ tags }) =>
          !tags ||
          tags.length === 0 ||
          shouldProceedCurrentStep(scenarioTags, tags)
      );
  }
}

function createRegistries() {
  const stepDefinitionRegistry = new StepDefinitionRegistry();
  const beforeHookRegistry = new HookRegistry();
  const afterHookRegistry = new HookRegistry();

  return {
    stepDefinitionRegistry,
    beforeHookRegistry,
    afterHookRegistry
  };
}

module.exports = createRegistries;
