const { createQueryEmbedding } = require("./embedding.service");

const { searchChunks } = require("./vector.service");

const { generateAnswer } = require("./nvidia.service");

async function answerQuestion(question, documentId) {
  const queryEmbedding = await createQueryEmbedding(question);

  const chunks = await searchChunks(queryEmbedding, documentId);

  if (!chunks || chunks.length === 0) {
    return "I could not find relevant information in the uploaded PDF.";
  }

  const context = chunks
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join("\n\n");

  const prompt = `
Answer the question using only the context provided below.

If the answer is not available in the context, say:
"I could not find this information in the uploaded PDF."

Context:
${context}

Question:
${question}
`;

  return await generateAnswer([
    {
      role: "system",
      content: `You are a helpful assistant.
Answer questions using only the provided PDF context.`,
    },
    {
      role: "user",
      content: prompt,
    },
  ]);
}

module.exports = {
  answerQuestion,
};
