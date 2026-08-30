const axios = require("axios");
const config = require("../config/env");

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const client = axios.create({
  baseURL: NVIDIA_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.nvidiaApiKey}`,
    "Content-Type": "application/json",
  },
});

async function generateAnswer(messages) {
  const response = await client.post("/chat/completions", {
    model: config.llmModel,
    messages,
    temperature: 0.2,
    max_tokens: 1000,
  });

  return response.data.choices[0].message.content;
}

module.exports = {
  generateAnswer,
};
