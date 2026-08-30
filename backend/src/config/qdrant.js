const { QdrantClient } = require("@qdrant/js-client-rest");
const config = require("./env");

const client = new QdrantClient({
  url: config.qdrantUrl,
  apiKey: config.qdrantApiKey,
});

module.exports = client;
