const nvidiaService = require("./nvidia.service.js");

function extractCleanTitle(rawText, fallback) {
  if (!rawText || typeof rawText !== "string") return fallback;

  // 1. Look for <title>...</title> tags
  const tagMatch = rawText.match(/<title>([\s\S]*?)<\/title>/i);
  if (tagMatch && tagMatch[1]) {
    const cleanedTag = tagMatch[1]
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/[.#*:]+$/g, "")
      .trim();
    if (cleanedTag.length >= 2 && cleanedTag.length <= 60) {
      return cleanedTag;
    }
  }

  // 2. Remove thinking tags (<think>...</think>)
  let text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (text.includes("<think>")) {
    text = text.replace(/<think>[\s\S]*/gi, "").trim();
  }
  if (!text) return fallback;

  // 3. Search from the LAST line backwards (reasoning models put the final answer at the bottom)
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .reverse();

  for (let line of lines) {
    // Skip reasoning or thought lines
    if (
      /^(here('s| is)|thinking|thought process|reasoning|analysis|summary:|let's|\d+\.|\-|\*)/i.test(
        line,
      )
    ) {
      continue;
    }
    if (line.endsWith(":") || line.toLowerCase().includes("thinking process")) {
      continue;
    }

    // Strip common AI prefixes
    let cleaned = line
      .replace(
        /^(\*{1,3}|_{1,3})?(Title|Topic|Subject|Conversation Title):?(\*{1,3}|_{1,3})?\s*/i,
        "",
      )
      .replace(
        /^(Here (is|are)|Here's|Sure,?\s*here is|Sure thing!?).*?:\s*/i,
        "",
      )
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/[.#*:]+$/g, "")
      .trim();

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
          "You are a conversation titling assistant. Output a short 3 to 5 word title that describes the user's message. Wrap the final title strictly inside <title> and </title> tags. Example: <title>Quantum Computing Basics</title>. Output nothing else.",
      },
      {
        role: "user",
        content: `Create a 3-5 word title for a conversation that starts with this message:\n"${trimmedMessage.slice(0, 400)}"`,
      },
    ];

    const rawTitle = await nvidiaService.generateAnswer(prompt, {
      max_tokens: 1024,
      temperature: 0.2,
    });

    return extractCleanTitle(rawTitle, fallbackTitle);
  } catch (error) {
    console.error("Title generation error:", error.message || error);
    return fallbackTitle;
  }
}

module.exports = { generateConversationTitle };
