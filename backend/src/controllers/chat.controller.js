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
      !conversation.title ||
      conversation.title.trim().toLowerCase() === "new chat";

    // Start saving user message in parallel
    const saveUserMessagePromise = messageModel.createMessage(
      conversationId,
      "user",
      message.trim(),
    );

    // Setup Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    headersSent = true;

    const sendChunk = (token) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    };

    let answer = "";

    // 1. Generate and stream the response FIRST (RAG + Chat or Only Chat)
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
          content:
            "You are a helpful, intelligent, and concise AI assistant. Answer user queries accurately.",
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

    // Persist user and assistant messages
    await saveUserMessagePromise;
    await messageModel.createMessage(conversationId, "assistant", answer);

    // 2. AFTER response generation completes, call title generation serially
    if (isFirstMessage) {
      try {
        const title = await generateConversationTitle(message.trim());
        if (title) {
          await conversationModel.updateConversationTitle(
            conversationId,
            title,
          );
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ title })}\n\n`);
          }
        }
      } catch (titleError) {
        console.error(
          "Title generation error:",
          titleError.message || titleError,
        );
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (
      error.message === "aborted" ||
      error.code === "ECONNABORTED" ||
      req.signal?.aborted
    ) {
      console.log("Chat stream was cancelled or closed by client.");
      return;
    }

    let errorDetail = error.message || "An error occurred";
    if (error.response?.data) {
      if (typeof error.response.data === "string") {
        errorDetail = error.response.data;
      } else if (typeof error.response.data.on === "function") {
        try {
          let rawData = "";
          for await (const chunk of error.response.data) {
            rawData += chunk.toString();
          }
          const parsed = JSON.parse(rawData);
          errorDetail = parsed.detail || parsed.message || rawData;
        } catch (_) {}
      } else if (error.response.data.detail) {
        errorDetail = error.response.data.detail;
      } else if (error.response.data.message) {
        errorDetail = error.response.data.message;
      }
    }

    console.error("Chat error:", errorDetail);

    if (!headersSent) {
      res.status(error.response?.status || 500).json({
        message: errorDetail,
      });
    } else {
      try {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: errorDetail })}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();
        }
      } catch (writeErr) {
        // Stream already closed
      }
    }
  }
}

module.exports = {
  chat,
};
