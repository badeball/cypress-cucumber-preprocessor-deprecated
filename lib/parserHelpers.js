const { fromSources } = require("gherkin").default;
const { messages, IdGenerator } = require("cucumber-messages");

function streamToArray(readableStream) {
  return new Promise((resolve, reject) => {
    const items = [];
    readableStream.on("data", items.push.bind(items));
    readableStream.on("error", err => reject(err));
    readableStream.on("end", () => resolve(items));
  });
}

function makeSourceEnvelope(data, uri) {
  return new messages.Envelope({
    source: new messages.Source({
      data,
      uri,
      media: new messages.Media({
        encoding: messages.Media.Encoding.UTF8,
        contentType: "text/x.cucumber.gherkin+plain"
      })
    })
  });
}

async function parse(data, uri) {
  const options = {
    includeSource: false,
    includeGherkinDocument: true,
    includePickles: false,
    newId: IdGenerator.incrementing()
  };

  const [
    {
      gherkinDocument: { feature }
    }
  ] = await streamToArray(
    fromSources([makeSourceEnvelope(data.toString(), uri)], options)
  );

  return feature;
}

function generateEvents(data, uri) {
  const options = {
    includeSource: true,
    includeGherkinDocument: true,
    includePickles: true,
    newId: IdGenerator.incrementing()
  };

  return streamToArray(
    fromSources([makeSourceEnvelope(data.toString(), uri)], options)
  );
}

module.exports = { generateEvents, parse };
