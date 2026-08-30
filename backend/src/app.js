const express = require("express");
const cors = require("cors");

const conversationRoutes = require("./routes/conversation.routes");
const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.get("/", (req, res) => {
    res.json({
        message: "RAG API is running"
    });
});

app.use(
    "/api/conversations",
    conversationRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

app.use(
    "/api/chat",
    chatRoutes
);


// Handle routes that do not exist
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});


// Global error handler
app.use((error, req, res, next) => {

    // Invalid JSON
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            message: "Invalid JSON format"
        });
    }


    // Multer file upload errors
    if (error.name === "MulterError") {
        return res.status(400).json({
            message: error.message
        });
    }


    // File type validation errors
    if (error.message === "Only PDF files are allowed") {
        return res.status(400).json({
            message: error.message
        });
    }


    // Unexpected errors
    console.error("Server error:", error);

    return res.status(
        error.status || 500
    ).json({
        message: error.message || "Internal server error"
    });
});


module.exports = app;