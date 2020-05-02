const methods = [
  "given",
  "when",
  "then",
  "and",
  "but",
  "Given",
  "When",
  "Then",
  "And",
  "But",
  "Before",
  "After",
  "defineParameterType",
  "defineStep"
];

module.exports = methods.reduce(
  (acum, method) => ({
    ...acum,
    [method](...args) {
      return window[method](...args);
    }
  }),
  {}
);
