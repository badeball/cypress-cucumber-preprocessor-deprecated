const { Given } = require("cucumber");
const path = require("path");
const { promises: fs } = require("fs");
const { name: packageName } = require("../../package");

async function addOrUpdateConfiguration(
  absoluteConfigPath,
  additionalJsonContent
) {
  let existingConfig;

  try {
    existingConfig = JSON.parse(
      (await fs.readFile(absoluteConfigPath)).toString()
    );
  } catch (e) {
    if (e.code === "ENOENT") {
      existingConfig = {};
    } else {
      throw e;
    }
  }

  await fs.writeFile(
    absoluteConfigPath,
    JSON.stringify(
      {
        ...existingConfig,
        ...JSON.parse(additionalJsonContent),
      },
      null,
      2
    )
  );
}

Given("additional preprocessor configuration", async function (jsonContent) {
  const absoluteConfigPath = path.join(this.tmpDir, `.${packageName}rc`);

  await addOrUpdateConfiguration(absoluteConfigPath, jsonContent);
});

Given("additional Cypress configuration", async function (jsonContent) {
  const absoluteConfigPath = path.join(this.tmpDir, "cypress.json");

  await addOrUpdateConfiguration(absoluteConfigPath, jsonContent);
});
