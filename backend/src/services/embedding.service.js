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

const CONCURRENCY_LIMIT = 4;

async function fetchBatchEmbedding(batch, batchIndex, totalBatches) {
  console.log(
    `Processing embedding batch ${batchIndex + 1}/${totalBatches} (${batch.length} chunks)...`,
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

  return response.data.data.map((item) => item.embedding);
}

async function createEmbeddings(texts) {
  if (!texts || texts.length === 0) return [];

  const batches = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  const results = new Array(batches.length);

  // Process batches in parallel groups of CONCURRENCY_LIMIT
  for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
    const group = batches.slice(i, i + CONCURRENCY_LIMIT);
    const groupPromises = group.map((batch, idx) => {
      const batchIdx = i + idx;
      return fetchBatchEmbedding(batch, batchIdx, batches.length).then(
        (embeddings) => {
          results[batchIdx] = embeddings;
        },
      );
    });

    await Promise.all(groupPromises);
  }

  return results.flat();
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
