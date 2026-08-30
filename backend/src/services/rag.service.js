const { createQueryEmbedding } = require("./embedding.service");

const { searchChunks } = require("./vector.service");

const { generateAnswer, generateAnswerStream } = require("./nvidia.service");

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

async function answerQuestion(question, documentId, chatHistory = []) {
  const queryEmbedding = await createQueryEmbedding(question);
  const chunks = await searchChunks(queryEmbedding, documentId);

  if (!chunks || chunks.length === 0) {
    return "I could not find relevant information in the uploaded PDF.";
  }

  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join("\n\n");

  const messages = buildRagMessages(question, context, chatHistory);
  return await generateAnswer(messages);
}

async function answerQuestionStream(
  question,
  documentId,
  chatHistory = [],
  onChunk,
) {
  const queryEmbedding = await createQueryEmbedding(question);
  const chunks = await searchChunks(queryEmbedding, documentId);

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
  return await generateAnswerStream(messages, onChunk);
}

module.exports = {
  answerQuestion,
  answerQuestionStream,
};
