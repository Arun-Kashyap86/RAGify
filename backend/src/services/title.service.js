const nvidiaService = require("./nvidia.service.js");

function extractCleanTitle(rawText, fallback) {
  if (!rawText || typeof rawText !== "string") return fallback;

  // 1. Remove reasoning / think blocks (<think>...</think>) from models like DeepSeek-R1
  let text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // If think tag wasn't closed, remove everything after <think>
  if (text.includes("<think>")) {
    text = text.replace(/<think>[\s\S]*/gi, "").trim();
  }

  if (!text) return fallback;

  // 2. Split lines and look for the first valid title line
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let line of lines) {
    // Strip common AI prefixes
    let cleaned = line
      .replace(
        /^(\*{1,3}|_{1,3})?(Title|Topic|Subject|Conversation Title):?(\*{1,3}|_{1,3})?\s*/i,
        "",
      )
      .replace(/^(Here (is|are)|Sure,?\s*here is|Sure thing!?).*?:\s*/i, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/[.#*]+$/g, "")
      .trim();

    // Validate clean title (must be between 2 and 60 characters and not HTML/tag)
    if (
      cleaned.length >= 2 &&
      cleaned.length <= 60 &&
      !cleaned.startsWith("<")
    ) {
      return cleaned;
    }
  }

  return fallback;
}

async function generateConversationTitle(message) {
  if (!message || typeof message !== "string" || !message.trim()) {
    return "New Chat";
  }

  const trimmedMessage = message.trim();

  const fallbackTitle =
    trimmedMessage
      .split(/\s+/)
      .slice(0, 5)
      .join(" ")
      .replace(/[^\w\s-]/g, "")
      .slice(0, 40) || "New Chat";

  try {
    const prompt = [
      {
        role: "system",
        content:
          "You are a professional conversation titling assistant. Your job is to output a short, clean, 3 to 10 word title that captures the core subject of the user's inquiry.\n\nRules:\n- Output ONLY the title text\n- Do not include 'Title:', quotes, asterisks, or punctuation\n- Do not answer the question\n- Do not output thinking tags or explanations",
      },
      {
        role: "user",
        content: `What is a short 3-5 word title for a conversation that begins with this inquiry:\n\n"${trimmedMessage.slice(0, 500)}"`,
      },
    ];

    const rawTitle = await nvidiaService.generateAnswer(prompt, {
      max_tokens: 300,
      temperature: 0.2,
    });

    return extractCleanTitle(rawTitle, fallbackTitle);
  } catch (error) {
    console.error("Title generation error:", error.message || error);
    return fallbackTitle;
  }
}

module.exports = { generateConversationTitle };
