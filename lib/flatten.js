module.exports = function flatten (collection) {
  return collection.reduce((acum, materials) => acum.concat(materials), []);
};
