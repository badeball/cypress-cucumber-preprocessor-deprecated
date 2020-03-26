const { Given } = require("cucumber");
const stripIndent = require("strip-indent");
const path = require("path");
const { writeFile } = require("../support/helpers");

Given("a file named {string} with:", async function(filePath, fileContent) {
  const absoluteFilePath = path.join(this.tmpDir, filePath);

  await writeFile(absoluteFilePath, stripIndent(fileContent));
});

Given("an empty file named {string}", async function(filePath) {
  const absoluteFilePath = path.join(this.tmpDir, filePath);

  await writeFile(absoluteFilePath, "");
});
