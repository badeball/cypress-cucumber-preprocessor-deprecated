const statuses = require("cucumber/lib/status").default;

class CucumberDataCollector {
  constructor(uri, source) {
    this.scenarioSteps = {};
    this.runPickles = {};
    this.runTests = {};
    this.stepResults = {};
    this.testError = null;
    this.uri = uri;
    this.source = source;

    this.currentScenario = null;
    this.currentStep = 0;

    this.timer = Date.now();

    this.logStep = step => {
      Cypress.log({
        name: "step",
        displayName: step.keyword,
        message: `**${step.text}**`,
        consoleProps: () => ({ feature: this.uri, step })
      });
    };

    this.onStartTest = () => {};

    this.onFinishTest = () => {
      if (this.testError) {
        this.attachErrorToFailingStep();
      }
    };

    this.onStartScenario = (pickle, stepsToRun) => {
      this.currentScenario = pickle;
      this.currentStep = 0;
      this.stepResults = {};
      this.scenarioSteps[pickle.name] = stepsToRun;
      this.testError = null;

      stepsToRun.forEach(step => {
        this.stepResults[step.index] = { status: statuses.PENDING };
      });
      this.runPickles[pickle.name] = pickle;
    };

    this.onFinishScenario = pickle => {
      this.markStillPendingStepsAsSkipped(pickle);
      this.recordScenarioResult(pickle);
    };

    this.onStartStep = step => {
      this.currentStep = step.index;
      this.setStepToPending(step);
      this.logStep(step);
    };

    this.onFinishStep = (step, result) => {
      this.recordStepResult(step, result);
    };

    this.onFail = err => {
      this.testError = err;
      if (
        err.message &&
        err.message.indexOf("Step implementation missing for") > -1
      ) {
        this.stepResults[this.currentStep] = {
          status: statuses.UNDEFINED,
          duration: this.timeTaken()
        };
      } else {
        this.stepResults[this.currentStep] = {
          status: statuses.FAILED,
          duration: this.timeTaken(),
          exception: this.testError
        };
      }
      this.onFinishScenario(this.currentScenario);
    };

    this.timeTaken = () => {
      const now = Date.now();
      const duration = now - this.timer;
      this.timer = now;
      return duration;
    };

    function last(collection) {
      return collection[collection.length - 1];
    }

    this.formatTestCase = pickle => {
      const { line } = last(pickle.locations);
      return {
        sourceLocation: { uri, line }
      };
    };

    this.attachErrorToFailingStep = () => {
      Object.keys(this.runTests).forEach(test => {
        const stepResults = this.runTests[test];
        Object.keys(stepResults).forEach(stepIdx => {
          const stepResult = stepResults[stepIdx];
          if (stepResult.result === statuses.FAILED) {
            stepResult.exception = this.testError;
          }
        });
      });
    };

    this.markStillPendingStepsAsSkipped = pickle => {
      this.runTests[pickle.name] = Object.keys(this.stepResults).map(key => {
        const result = this.stepResults[key];
        return Object.assign({}, result, {
          status:
            result.status === statuses.PENDING
              ? statuses.SKIPPED
              : result.status
        });
      });
    };
    this.recordScenarioResult = pickle => {
      this.runTests[pickle.name].result = this.anyStepsHaveFailed(pickle)
        ? statuses.FAILED
        : statuses.PASSED;
    };

    this.setStepToPending = step => {
      this.stepResults[step.index] = { status: statuses.PENDING };
    };

    this.recordStepResult = (step, result) => {
      this.stepResults[step.index] = {
        status: result,
        duration: this.timeTaken()
      };
    };

    this.anyStepsHaveFailed = () =>
      Object.values(this.stepResults).find(e => e.status !== statuses.PASSED);
  }
}

module.exports = { CucumberDataCollector };
