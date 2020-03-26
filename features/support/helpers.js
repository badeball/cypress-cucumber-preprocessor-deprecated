const { promises: fs } = require("fs");
const path = require("path");

async function writeFile(filePath, fileContent) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, fileContent);
}

module.exports = { writeFile };
