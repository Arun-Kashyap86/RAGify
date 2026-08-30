const nvidiaService = require("./nvidia.service.js");

async function generateConversationTitle(message) {
  if (!message || typeof message !== "string" || !message.trim()) {
    return "New Chat";
  }

  // Safe fallback title extracted from the first few words of user message
  const fallbackTitle =
    message
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join(" ")
      .replace(/[^\w\s-]/g, "")
      .slice(0, 40) || "New Chat";

  try {
    const prompt = [
      {
        role: "system",
        content: `Generate a short and meaningful title (max 5 words) for a conversation based on the user's message.
Rules:
- Maximum 5 words
- Do not use quotation marks
- Do not end with punctuation
- Return only the title in plain text`,
      },
      {
        role: "user",
        content: message.slice(0, 250),
      },
    ];

    const rawTitle = await nvidiaService.generateAnswer(prompt, {
      max_tokens: 40,
      temperature: 0.2,
    });

    if (rawTitle && typeof rawTitle === "string" && rawTitle.trim()) {
      const cleanTitle = rawTitle.trim().replace(/^["']|["']$/g, "").trim();
      return cleanTitle.slice(0, 60) || fallbackTitle;
    }

    return fallbackTitle;
  } catch (error) {
    console.warn("Title generation LLM error, using fallback title:", error.message || error);
    return fallbackTitle;
  }
}

module.exports = { generateConversationTitle };
