const fs = require("fs").promises;
const conversationModel = require("../models/conversation.model");
const messageModel = require("../models/message.model");
const documentModel = require("../models/document.model");
const { deleteDocumentVectors } = require("../services/vector.service");
const { validate: isUUID } = require("uuid");

async function createConversation(req, res) {
  try {
    const { title } = req.body;

    const conversation = await conversationModel.createConversation(
      title || "New Chat",
    );

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create conversation",
    });
  }
}

async function getConversations(req, res) {
  try {
    const conversations = await conversationModel.getConversations();

    res.json(conversations);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get conversations",
    });
  }
}

async function getConversation(req, res) {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await conversationModel.getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const messages = await messageModel.getMessages(id);

    res.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get conversation",
    });
  }
}

async function deleteConversation(req, res) {
  try {
    const { id } = req.params;

    if (!isUUID(id)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    const conversation = await conversationModel.getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    if (conversation.document_id) {
      try {
        const document = await documentModel.getDocument(
          conversation.document_id,
        );
        await deleteDocumentVectors(conversation.document_id);
        if (document && document.file_path) {
          try {
            await fs.unlink(document.file_path);
          } catch (fileErr) {
            // File may have been deleted already
          }
        }
        await documentModel.deleteDocument(conversation.document_id);
      } catch (docCleanupErr) {
        console.error(
          "Error cleaning up document resources:",
          docCleanupErr.message,
        );
      }
    }

    await conversationModel.deleteConversation(id);

    res.json({
      message: "Conversation deleted",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete conversation",
    });
  }
}

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
};
