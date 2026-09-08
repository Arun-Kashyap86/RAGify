const { validate: isUUID } = require("uuid");
const conversationModel = require("../models/conversation.model");
const messageModel = require("../models/message.model");
const ragService = require("../services/rag.service");
const { generateAnswerStream } = require("../services/nvidia.service");
const { generateConversationTitle } = require("../services/title.service");

async function chat(req, res) {
  let headersSent = false;

  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message || !message.trim()) {
      return res.status(400).json({
        message: "conversationId and message are required",
      });
    }

    if (!isUUID(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const userId = req.user?.id || null;

    // Parallelize conversation and message history fetch to reduce TTFT
    const [conversation, previousMessages] = await Promise.all([
      conversationModel.getConversation(conversationId, userId),
      messageModel.getMessages(conversationId),
    ]);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const chatHistory = previousMessages.slice(-10).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    const isFirstMessage =
      (!conversation.title ||
        conversation.title.trim().toLowerCase() === "new chat") &&
      previousMessages.length === 0;

    // Start saving user message in parallel with stream initialization
    const saveUserMessagePromise = messageModel.createMessage(
      conversationId,
      "user",
      message.trim(),
    );

    // Setup Server-Sent Events headers immediately
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    headersSent = true;

    const sendChunk = (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    };

    // Start title generation concurrently in parallel with answer streaming
    let titlePromise = null;
    if (isFirstMessage) {
      titlePromise = generateConversationTitle(message.trim())
        .then(async (title) => {
          if (!title) return null;
          // Push title over the active SSE stream immediately to the client
          res.write(`data: ${JSON.stringify({ title })}\n\n`);
          await conversationModel.updateConversationTitle(
            conversationId,
            title,
          );
          return title;
        })
        .catch((error) => {
          console.error("Title generation error:", error.message);
          return null;
        });
    }

    let answer = "";

    if (conversation.document_id) {
      answer = await ragService.answerQuestionStream(
        message.trim(),
        conversation.document_id,
        chatHistory,
        sendChunk,
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

      answer = await generateAnswerStream(messages, sendChunk);
    }

    if (!answer || !answer.trim()) {
      answer = "I'm sorry, I was unable to generate a response.";
      sendChunk(answer);
    }

    // Ensure user message is saved, then persist assistant message to database
    await saveUserMessagePromise;
    await messageModel.createMessage(conversationId, "assistant", answer);

    if (titlePromise) {
      await titlePromise;
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (
      error.message === "aborted" ||
      error.code === "ECONNABORTED" ||
      req.destroyed ||
      res.writableEnded
    ) {
      console.log("Chat stream was cancelled or closed by client.");
      return;
    }

    console.error("Chat streaming error:", error.message || error);

    if (!headersSent) {
      res.status(500).json({
        message: error.message || "Failed to process chat message",
      });
    } else {
      try {
        res.write(
          `data: ${JSON.stringify({ error: error.message || "Streaming interrupted" })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (writeErr) {
        // Stream already closed
      }
    }
  }
}

module.exports = {
  chat,
};
