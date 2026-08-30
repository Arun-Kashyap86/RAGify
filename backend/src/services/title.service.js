const nvidiaService = require("./nvidia.service.js");

async function generateConversationTitle(message) {
  const prompt = [
    {
      role: "system",
      content: `Generate a short and meaningful title for a conversation based on the user's first message.

                Rules:
                - Maximum 6 words
                - Do not use quotation marks
                - Do not end with punctuation
                - Return only the title
                - Return title in plain text

                User message:
                ${message}`,
    },
    {
      role: "user",
      content: message,
    },
  ];
  const title = await nvidiaService.generateAnswer(prompt);

  return title.trim().replace(/^["']|["']$/g, "");
}

module.exports = { generateConversationTitle };
