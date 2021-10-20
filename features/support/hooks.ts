import { After, Before, formatterHelpers } from "@cucumber/cucumber";
import path from "path";
import assert from "assert";
import { promises as fs } from "fs";
import { writeFile } from "./helpers";

const projectPath = path.join(__dirname, "..", "..");

Before(async function ({ gherkinDocument, pickle }) {
  assert(gherkinDocument.uri, "Expected gherkinDocument.uri to be present");

  const relativeUri = path.relative(process.cwd(), gherkinDocument.uri);

  const { line } = formatterHelpers.PickleParser.getPickleLocation({
    gherkinDocument,
    pickle,
  });

  this.tmpDir = path.join(projectPath, "tmp", `${relativeUri}_${line}`);

  await fs.rm(this.tmpDir, { recursive: true, force: true });

  await writeFile(
    path.join(this.tmpDir, "cypress.json"),
    JSON.stringify(
      {
        testFiles: "**/*.feature",
        video: false,
      },
      null,
      2
    )
  );

  await fs.mkdir(path.join(this.tmpDir, "node_modules", "@badeball"), {
    recursive: true,
  });

  await fs.symlink(
    projectPath,
    path.join(
      this.tmpDir,
      "node_modules",
      "@badeball",
      "cypress-cucumber-preprocessor"
    )
  );
});

Before({ tags: "not @no-default-plugin" }, async function () {
  await writeFile(
    path.join(this.tmpDir, "cypress", "plugins", "index.js"),
    `
      const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
      const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");

      module.exports = (on, config) => {
        on(
          "file:preprocessor",
          createBundler({
            plugins: [createEsbuildPlugin(config)]
          })
        );
      }
    `
  );
});

After(function () {
  if (
    this.lastRun != null &&
    this.lastRun.exitCode !== 0 &&
    !this.verifiedLastRunError
  ) {
    throw new Error(
      `Last run errored unexpectedly. Output:\n\n${this.lastRun.output}`
    );
  }
});
