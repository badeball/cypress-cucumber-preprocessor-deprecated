import {
  CucumberExpression,
  RegularExpression,
  Expression,
  ParameterTypeRegistry,
  ParameterType,
} from "@cucumber/cucumber-expressions";

import DataTable from "@cucumber/cucumber/lib/models/data_table";

import parse from "@cucumber/tag-expressions";

import * as stackTraceParser from "stacktrace-parser";

import isPathInside from "is-path-inside";

import path from "path";

import { IParameterTypeDefinition } from "./types";

interface IStepDefinition {
  file: string;
  line: number;
  expression: Expression;
  implementation: (...args: any[]) => void;
}

interface IHook {
  node: ReturnType<typeof parse>;
  implementation: () => void;
}

function parseHookArguments(
  optionsOrFn: (() => void) | { tags?: string },
  maybeFn?: () => void
): IHook {
  const noopNode = { evaluate: () => true };

  if (typeof optionsOrFn === "function") {
    if (maybeFn) {
      throw new Error("Unexpected argument for Before hook");
    }

    return { implementation: optionsOrFn, node: noopNode };
  } else if (typeof optionsOrFn === "object") {
    if (typeof maybeFn !== "function") {
      throw new Error("Unexpected argument for Before hook");
    }

    return {
      node: optionsOrFn.tags ? parse(optionsOrFn.tags) : noopNode,
      implementation: maybeFn,
    };
  } else {
    throw new Error("Unexpected argument for Before hook");
  }
}

function isFileNameInpreprocessor(filepath: string) {
  return filepath.includes("@badeball/cypress-cucumber-preprocessor");
}

function getDefinitionLineAndFile() {
  const unparsedStack = new Error().stack;

  if (unparsedStack) {
    const stackframes = stackTraceParser.parse(unparsedStack);
    const stackframe = stackframes.find((frame) => {
      return frame.file && !isFileNameInpreprocessor(frame.file);
    });

    if (stackframe) {
      const line = stackframe.lineNumber || 0;
      const file = stackframe.file || "unkown";

      return {
        line,
        file,
      };
    }
  }

  return {
    line: 0,
    file: "unknown",
  };
}

export class Registry {
  public methods: {
    Given<T extends unknown[]>(
      description: string | RegExp,
      body: (this: Mocha.ITestCallbackContext, ...args: T) => void
    ): void;
    When<T extends unknown[]>(
      description: string | RegExp,
      body: (this: Mocha.ITestCallbackContext, ...args: T) => void
    ): void;
    Then<T extends unknown[]>(
      description: string | RegExp,
      body: (this: Mocha.ITestCallbackContext, ...args: T) => void
    ): void;
    Step(
      world: Mocha.ITestCallbackContext,
      description: string,
      argument?: DataTable | string
    ): void;
    defineParameterType<T>(options: IParameterTypeDefinition<T>): void;
    Before(
      this: Mocha.ITestCallbackContext,
      options: { tags?: string },
      fn: () => void
    ): void;
    Before(this: Mocha.ITestCallbackContext, fn: () => void): void;
    After(
      this: Mocha.ITestCallbackContext,
      options: { tags?: string },
      fn: () => void
    ): void;
    After(this: Mocha.ITestCallbackContext, fn: () => void): void;
  };

  private parameterTypeRegistry: ParameterTypeRegistry;

  private stepDefinitions: IStepDefinition[];

  private beforeHooks: IHook[];

  private afterHooks: IHook[];

  constructor() {
    this.methods = {
      Given: this.defineStep.bind(this),
      When: this.defineStep.bind(this),
      Then: this.defineStep.bind(this),
      Step: this.runStepDefininition.bind(this),
      defineParameterType: this.defineParameterType.bind(this),
      Before: this.defineBefore.bind(this),
      After: this.defineAfter.bind(this),
    };

    this.parameterTypeRegistry = new ParameterTypeRegistry();

    this.stepDefinitions = [];

    this.beforeHooks = [];

    this.afterHooks = [];
  }

  private defineStep(description: string | RegExp, implementation: () => void) {
    const { line, file } = getDefinitionLineAndFile();

    if (typeof description === "string") {
      this.stepDefinitions.push({
        line,
        file,
        expression: new CucumberExpression(
          description,
          this.parameterTypeRegistry
        ),
        implementation,
      });
    } else if (description instanceof RegExp) {
      this.stepDefinitions.push({
        line,
        file,
        expression: new RegularExpression(
          description,
          this.parameterTypeRegistry
        ),
        implementation,
      });
    } else {
      throw new Error("Unexpected argument for step definition");
    }
  }

  private defineParameterType<T>({
    name,
    regexp,
    transformer,
    useForSnippets,
    preferForRegexpMatch,
  }: IParameterTypeDefinition<T>) {
    if (typeof useForSnippets !== "boolean") useForSnippets = true;
    if (typeof preferForRegexpMatch !== "boolean") preferForRegexpMatch = false;

    this.parameterTypeRegistry.defineParameterType(
      new ParameterType(
        name,
        regexp,
        null,
        transformer,
        useForSnippets,
        preferForRegexpMatch
      )
    );
  }

  private defineBefore(options: { tags?: string }, fn: () => void): void;
  private defineBefore(fn: () => void): void;
  private defineBefore(
    optionsOrFn: (() => void) | { tags?: string },
    maybeFn?: () => void
  ) {
    this.beforeHooks.push(parseHookArguments(optionsOrFn, maybeFn));
  }

  private defineAfter(options: { tags?: string }, fn: () => void): void;
  private defineAfter(fn: () => void): void;
  private defineAfter(
    optionsOrFn: (() => void) | { tags?: string },
    maybeFn?: () => void
  ) {
    this.afterHooks.push(parseHookArguments(optionsOrFn, maybeFn));
  }

  private resolveStepDefintion(text: string) {
    const matchingStepDefinitions = this.stepDefinitions.filter(
      (stepDefinition) => stepDefinition.expression.match(text)
    );

    if (matchingStepDefinitions.length === 0) {
      throw new Error(`Step implementation missing for: ${text}`);
    } else if (matchingStepDefinitions.length > 1) {
      throw new Error(
        `Multiple matching step definitions for: ${text}\n` +
          matchingStepDefinitions
            .map((stepDefinition) => {
              const { expression } = stepDefinition;
              if (expression instanceof RegularExpression) {
                return ` ${expression.regexp} - ${stepDefinition.file}:${stepDefinition.line}`;
              } else if (expression instanceof CucumberExpression) {
                return ` ${expression.source} - ${stepDefinition.file}:${stepDefinition.line}`;
              }
            })
            .join("\n")
      );
    } else {
      return matchingStepDefinitions[0];
    }
  }

  public runStepDefininition(
    world: any,
    text: string,
    argument?: DataTable | string
  ) {
    const stepDefinition = this.resolveStepDefintion(text);

    const args = stepDefinition.expression
      .match(text)
      .map((match) => match.getValue(world));

    if (argument) {
      args.push(argument);
    }

    stepDefinition.implementation.apply(world, args);
  }

  public runBeforeHooks(world: any, tags: string[]) {
    this.beforeHooks
      .filter((beforeHook) => beforeHook.node.evaluate(tags))
      .forEach((hook) => hook.implementation.call(world));
  }

  public runAfterHooks(world: any, tags: string[]) {
    return this.afterHooks
      .filter((beforeHook) => beforeHook.node.evaluate(tags))
      .forEach((hook) => hook.implementation.call(world));
  }
}

export default new Registry();
