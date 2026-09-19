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

async function uploadDocument(req, res) {
  let createdDocument = null;

  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        message: "conversationId is required",
      });
    }

    if (!isValidUUID(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID",
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const userId = req.user?.id || null;
    const conversation = await conversationModel.getConversation(
      conversationId,
      userId,
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    if (conversation.document_id) {
      return res.status(400).json({
        message: "This conversation already has a PDF",
      });
    }

    // Extract text directly from in-memory Buffer (no disk write)
    const pdf = await extractText(req.file.buffer);

    if (!pdf.text || !pdf.text.trim()) {
      return res.status(400).json({
        message: "Could not extract readable text from PDF",
      });
    }

    const chunks = createChunks(pdf.text);
    if (chunks.length === 0) {
      return res.status(400).json({
        message: "No text chunks could be created from this PDF",
      });
    }

    createdDocument = await documentModel.createDocument(
      req.file.originalname,
      "in-memory",
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
