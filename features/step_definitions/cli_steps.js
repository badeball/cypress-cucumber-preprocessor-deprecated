const { When, Then } = require("cucumber");
const assert = require("assert");
const childProcess = require("child_process");

function execAsync(...args) {
  return new Promise((resolve, reject) => {
    childProcess.exec(...args, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

When("I run cypress", { timeout: 60 * 1000 }, async function() {
  await this.run();
});

When("I run cypress with {string}", { timeout: 60 * 1000 }, async function(
  unparsedArgs
) {
  // Use user's preferred shell to split args.
  const { stdout } = await execAsync(
    `node -p "JSON.stringify(process.argv)" -- ${unparsedArgs}`
  );

  // Drop 1st arg, which is the path of node.
  const [, ...args] = JSON.parse(stdout);

  await this.run(args);
});

Then("it passes", function() {
  assert.equal(this.lastRun.exitCode, 0, "Expected a zero exit code");
});

Then("it fails", function() {
  assert.notEqual(this.lastRun.exitCode, 0, "Expected a non-zero exit code");
  this.verifiedLastRunError = true;
});

Then("it should appear as if only a single test ran", function() {
  assert.match(this.lastRun.stdout, /All specs passed!\s+\d+ms\s+1\s+1\D/);
});

Then("it should appear as if both tests ran", function() {
  assert.match(this.lastRun.stdout, /All specs passed!\s+\d+ms\s+2\s+2\D/);
});

/**
 * Shamelessly copied from the RegExp.escape proposal.
 */
const rescape = s => String(s).replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");

const scenarioExpr = scenarioName =>
  new RegExp(`✓ ${rescape(scenarioName)}( \\(\\d+ms\\))?\\n`);

Then("it should appear to have run the scenario {string}", function(
  scenarioName
) {
  assert.match(this.lastRun.stdout, scenarioExpr(scenarioName));
});

Then("it should appear to have run the scenarios", function(scenarioTable) {
  for (const { Name: scenarioName } of scenarioTable.hashes()) {
    assert.match(this.lastRun.stdout, scenarioExpr(scenarioName));
  }
});

Then("it should appear as if only a single file was ran", function() {
  assert.match(this.lastRun.stdout, /Specs:\s+1 found/);
});

Then("the output should contain", function(content) {
  assert.match(this.lastRun.stdout, new RegExp(rescape(content)));
});
