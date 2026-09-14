const { createQueryEmbedding } = require("./embedding.service");
const { searchChunks } = require("./vector.service");
const { generateAnswerStream } = require("./nvidia.service");

function buildRagMessages(question, context, chatHistory = []) {
  const systemMessage = {
    role: "system",
    content: `You are a helpful assistant. Answer questions using only the provided PDF context below.
If the answer is not available in the context, say: "I could not find this information in the uploaded PDF."

Context:
${context}`,
  };

  const formattedHistory = Array.isArray(chatHistory)
    ? chatHistory.map((item) => ({
        role: item.role,
        content: item.content,
      }))
    : [];

  return [
    systemMessage,
    ...formattedHistory,
    {
      role: "user",
      content: question,
    },
  ];
}

async function answerQuestionStream(
  question,
  documentId,
  chatHistory = [],
  onChunk,
  options = {},
) {
  if (options.signal?.aborted) {
    return "";
  }

  const queryEmbedding = await createQueryEmbedding(question);

  if (options.signal?.aborted) {
    return "";
  }

  const chunks = await searchChunks(queryEmbedding, documentId, options.userId);

  if (options.signal?.aborted) {
    return "";
  }

  if (!chunks || chunks.length === 0) {
    const notFoundText =
      "I could not find relevant information in the uploaded PDF.";
    if (typeof onChunk === "function") {
      onChunk(notFoundText);
    }
    return notFoundText;
  }

  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join("\n\n");

  const messages = buildRagMessages(question, context, chatHistory);
  return await generateAnswerStream(messages, onChunk, options);
}

module.exports = {
  answerQuestionStream,
};
