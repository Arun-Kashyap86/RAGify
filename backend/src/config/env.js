const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  embeddingModel: process.env.EMBEDDING_MODEL || process.env.embedding_model,
  llmModel: process.env.LLM_MODEL || process.env.llm_model_1,
  databaseUrl: process.env.DATABASE_URL,
  qdrantUrl: process.env.QDRANT_URL,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  jwtSecret: process.env.JWT_SECRET || "ragify-super-secret-jwt-key-2026",
};

if (!config.nvidiaApiKey) {
  throw new Error("NVIDIA_API_KEY is missing in .env");
}

if (!config.embeddingModel) {
  throw new Error("EMBEDDING_MODEL (or embedding_model) is missing in .env");
}

if (!config.llmModel) {
  throw new Error("LLM_MODEL (or llm_model_1) is missing in .env");
}

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is missing in .env");
}

if (!config.qdrantUrl) {
  throw new Error("QDRANT_URL is missing in .env");
}

module.exports = config;
