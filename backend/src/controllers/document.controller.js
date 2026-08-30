const fs = require("fs").promises;
const { extractText } = require("../services/pdf.service");
const { createChunks } = require("../services/chunk.service");
const { createEmbeddings } = require("../services/embedding.service.js");
const {
  storeChunks,
  deleteDocumentVectors,
} = require("../services/vector.service");
const documentModel = require("../models/document.model");
const conversationModel = require("../models/conversation.model");
const { validate: isValidUUID } = require("uuid");

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore file removal error if file already gone
  }
}

async function uploadDocument(req, res) {
  let createdDocument = null;

  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      if (req.file) await safeUnlink(req.file.path);
      return res.status(400).json({
        message: "conversationId is required",
      });
    }

    if (!isValidUUID(conversationId)) {
      if (req.file) await safeUnlink(req.file.path);
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const conversation =
      await conversationModel.getConversation(conversationId);

    if (!conversation) {
      await safeUnlink(req.file.path);
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    if (conversation.document_id) {
      await safeUnlink(req.file.path);
      return res.status(400).json({
        message: "This conversation already has a PDF",
      });
    }

    const pdf = await extractText(req.file.path);

    if (!pdf.text || !pdf.text.trim()) {
      await safeUnlink(req.file.path);
      return res.status(400).json({
        message: "Could not extract readable text from PDF",
      });
    }

    const chunks = createChunks(pdf.text);
    if (chunks.length === 0) {
      await safeUnlink(req.file.path);
      return res.status(400).json({
        message: "No text chunks could be created from this PDF",
      });
    }

    createdDocument = await documentModel.createDocument(
      req.file.originalname,
      req.file.path,
    );

    const embeddings = await createEmbeddings(chunks);
    console.log("Chunks:", chunks.length);
    console.log("Embeddings:", embeddings.length);

    await storeChunks(createdDocument.id, chunks, embeddings);

    await conversationModel.attachDocument(conversationId, createdDocument.id);

    res.status(201).json({
      message: "PDF uploaded and processed successfully",
      document: {
        id: createdDocument.id,
        fileName: createdDocument.file_name,
        pages: pdf.pages,
        chunks: chunks.length,
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error);

    if (req.file) {
      await safeUnlink(req.file.path);
    }

    if (createdDocument) {
      try {
        await documentModel.deleteDocument(createdDocument.id);
        await deleteDocumentVectors(createdDocument.id);
      } catch (cleanupError) {
        console.error("Cleanup error after failed upload:", cleanupError);
      }
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    res.status(500).json({
      message: error.message || "Failed to process PDF",
    });
  }
}

module.exports = {
  uploadDocument,
};
