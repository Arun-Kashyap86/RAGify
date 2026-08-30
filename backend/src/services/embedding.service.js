const axios = require("axios");
const https = require("https");
const config = require("../config/env");

const NVIDIA_EMBEDDING_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const BATCH_SIZE = 64;

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 60000,
});

async function createEmbeddings(texts) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    console.log(
      `Creating embeddings for ${i + 1} to ${i + batch.length} of ${texts.length}`,
    );

    const response = await axios.post(
      NVIDIA_EMBEDDING_URL,
      {
        model: config.embeddingModel,
        input: batch,
        input_type: "passage",
        encoding_format: "float",
      },
      {
        httpsAgent,
        headers: {
          Authorization: `Bearer ${config.nvidiaApiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const batchEmbeddings = response.data.data.map((item) => item.embedding);

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

async function createQueryEmbedding(text) {
  const response = await axios.post(
    NVIDIA_EMBEDDING_URL,
    {
      model: config.embeddingModel,
      input: [text],
      input_type: "query",
      encoding_format: "float",
    },
    {
      httpsAgent,
      headers: {
        Authorization: `Bearer ${config.nvidiaApiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.data[0].embedding;
}

module.exports = {
  createEmbeddings,
  createQueryEmbedding,
};
