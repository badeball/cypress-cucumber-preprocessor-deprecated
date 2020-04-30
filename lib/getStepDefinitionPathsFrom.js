const path = require("path");

module.exports = {
  getStepDefinitionPathsFrom: filePath =>
    filePath.substring(0, filePath.length - path.extname(filePath).length)
};
