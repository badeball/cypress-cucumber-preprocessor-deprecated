const { Then } = require("cucumber");
const path = require("path");
const { promises: fs } = require("fs");
const assert = require("assert");

function isObject(object) {
  return typeof object === "object" && object != null;
}

function* traverseTree(object) {
  if (!isObject(object)) {
    throw new Error(`Expected object, got ${typeof object}`);
  }

  yield object;

  for (const property of Object.values(object)) {
    if (isObject(property)) {
      yield* traverseTree(property);
    }
  }
}

function removeDurationAttributes(tree) {
  for (const node of traverseTree(tree)) {
    if (Object.prototype.hasOwnProperty.call(node, "duration")) {
      delete node.duration;
    }
  }

  return tree;
}

Then("there should be no JSON output", async function () {
  await assert.rejects(
    () => fs.readdir(path.join(this.tmpDir, "json")),
    {
      code: "ENOENT",
    },
    "Expected there to be no JSON directory"
  );
});

Then("there should be a JSON output similar to {string}", async function (
  fixturePath
) {
  const jsonAbsoluteirectory = path.join(this.tmpDir, "json");
  const jsonFiles = await fs.readdir(jsonAbsoluteirectory);

  assert.equal(
    jsonFiles.length,
    1,
    "Expected there to be one and only one JSON file"
  );

  const absoluteActualJsonPath = path.join(
    jsonAbsoluteirectory,
    jsonFiles.pop()
  );

  const absoluteExpectedJsonpath = path.join(
    process.cwd(),
    "features",
    fixturePath
  );

  const actualJsonOutput = removeDurationAttributes(
    JSON.parse((await fs.readFile(absoluteActualJsonPath)).toString())
  );

  if (process.env.WRITE_FIXTURES) {
    await fs.writeFile(
      absoluteExpectedJsonpath,
      JSON.stringify(actualJsonOutput, null, 2)
    );
  } else {
    const expectedJsonOutput = JSON.parse(
      (await fs.readFile(absoluteExpectedJsonpath)).toString()
    );
    assert.deepStrictEqual(actualJsonOutput, expectedJsonOutput);
  }
});
