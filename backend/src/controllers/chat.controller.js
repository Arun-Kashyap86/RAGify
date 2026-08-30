const conversationModel = require("../models/conversation.model");
const messageModel = require("../models/message.model");
const ragService = require("../services/rag.service");
const { generateAnswer } = require("../services/nvidia.service");
const { generateConversationTitle } = require("../services/title.service");

async function chat(req, res) {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message || !message.trim()) {
      return res.status(400).json({
        message: "conversationId and message are required",
      });
    }

    const conversation =
      await conversationModel.getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const previousMessages = await messageModel.getMessages(conversationId);

    const chatHistory = previousMessages.slice(-10).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    const isFirstMessage =
      conversation.title === "New Chat" && previousMessages.length === 0;

    await messageModel.createMessage(conversationId, "user", message.trim());

    let answerPromise;

    if (conversation.document_id) {
      answerPromise = ragService.answerQuestion(
        message.trim(),
        conversation.document_id,
        chatHistory,
      );
    } else {
      const messages = [
        {
          role: "system",
          content: "Answer the user's question clearly and helpfully.",
        },
        ...chatHistory,
        {
          role: "user",
          content: message.trim(),
        },
      ];

      answerPromise = generateAnswer(messages);
    }

    const titlePromise = isFirstMessage
      ? generateConversationTitle(message.trim())
      : null;

    const answer = await answerPromise;

    if (!answer) {
      throw new Error("LLM returned an empty answer");
    }

    await messageModel.createMessage(conversationId, "assistant", answer);

    res.json({
      answer,
    });

    if (titlePromise) {
      titlePromise
        .then(async (title) => {
          if (!title) return;

          await conversationModel.updateConversationTitle(
            conversationId,
            title,
          );
        })
        .catch((error) => {
          console.error("Title generation error:", error.message);
        });
    }
  } catch (error) {
    console.error("ERROR:", error.message);

    res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  chat,
};
