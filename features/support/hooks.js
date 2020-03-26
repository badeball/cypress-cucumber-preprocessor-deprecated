const { After, Before } = require("cucumber");
const path = require("path");
const { promises: fs } = require("fs");
const { writeFile } = require("./helpers");

const projectPath = path.join(__dirname, "..", "..");

Before(async function ({ sourceLocation }) {
  this.tmpDir = path.join(
    projectPath,
    "tmp",
    `${sourceLocation.uri}_${sourceLocation.line}`
  );

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

  await writeFile(
    path.join(this.tmpDir, "cypress", "plugins", "index.js"),
    `
      const { default: cucumber } = require("cypress-cucumber-preprocessor");

      module.exports = (on, config) => {
        on("file:preprocessor", cucumber())
      }
    `
  );

  await fs.mkdir(path.join(this.tmpDir, "node_modules"), {
    recursive: true,
  });

  await fs.symlink(
    projectPath,
    path.join(this.tmpDir, "node_modules", "cypress-cucumber-preprocessor")
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
