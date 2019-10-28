/* eslint-disable global-require */
/* global jest */
const fs = require("fs");

const { createTestsFromFeature } = require("../createTestsFromFeature");
const { parse } = require("../parserHelpers");

const resolveFeatureFromFile = featureFile => {
  const spec = fs.readFileSync(featureFile);
  const { feature } = parse(spec.toString());
  createTestsFromFeature(featureFile, spec, feature);
};

module.exports = {
  resolveFeatureFromFile
};
