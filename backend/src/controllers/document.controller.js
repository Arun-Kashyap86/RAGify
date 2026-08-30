const fs = require("fs");
const { extractText } = require("../services/pdf.service");
const { createChunks } = require("../services/chunk.service");
const { createEmbeddings } = require("../services/embedding.service.js");
const { storeChunks } = require("../services/vector.service");
const documentModel = require("../models/document.model");
const conversationModel = require("../models/conversation.model");
const { validate: isValidUUID } = require("uuid");

async function uploadDocument(req, res) {
    try {
        const { conversationId } = req.body;
        if (!conversationId) {
            return res.status(400).json({
                message: "conversationId is required"
            });
        }
        else if (!isValidUUID(conversationId)) {
            return res.status(400).json({
                message: "Invalid conversation ID"
            });
        }
        else if (!req.file && !conversationId) {
            return res.status(400).json({
                message: "PDF file and conversationId are required"
            });
        }

        else if (!req.file) {
            return res.status(400).json({
                message: "PDF file is required"
            });
        }

        const conversation = await conversationModel.getConversation(
            conversationId
        );

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found"
            });
        }
        if (conversation.document_id) {
            return res.status(400).json({
                message: "This conversation already has a PDF"
            });
        }

        const document = await documentModel.createDocument(
            req.file.originalname,
            req.file.path
        );

        const pdf = await extractText(req.file.path);

        if (!pdf.text.trim()) {
            await documentModel.deleteDocument(
                document.id
            );

            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: "Could not extract text from PDF"
            });
        }

        const chunks = createChunks(pdf.text);

        const embeddings = await createEmbeddings(chunks);
        console.log("Chunks:", chunks.length);
        console.log("Embeddings:", embeddings.length);
        await storeChunks(
            document.id,
            chunks,
            embeddings
        );

        await conversationModel.attachDocument(
            conversationId,
            document.id
        );

        res.status(201).json({
            message: "PDF uploaded and processed successfully",
            document: {
                id: document.id,
                fileName: document.file_name,
                pages: pdf.pages,
                chunks: chunks.length
            }
        });

    } catch (error) {
        console.error(
            "PDF processing error:",
            error
        );

        if (error.code === "22P02") {
            return res.status(400).json({
                message: "Invalid conversation ID"
            });
        }

        res.status(500).json({
            message: "Failed to process PDF"
        });
    }
}

module.exports = {
    uploadDocument
};