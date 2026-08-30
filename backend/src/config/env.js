const dotenv = require("dotenv");

dotenv.config();

const config = {
    port: process.env.PORT || 5000,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
    embeddingModel: process.env.embedding_model,
    llmModel: process.env.llm_model_1,
    databaseUrl:process.env.DATABASE_URL,
    qdrantUrl:process.env.QDRANT_URL,
    qdrantApiKey:process.env.QDRANT_API_KEY
};

if (!config.nvidiaApiKey) {
    throw new Error("NVIDIA_API_KEY is missing in .env");
}

if (!config.embeddingModel) {
    throw new Error("embedding_model is missing in .env");
}

if (!config.llmModel) {
    throw new Error("llm_model_1 is missing in .env");
}

module.exports = config;