const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const conversationRoutes = require("./routes/conversation.routes");
const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");
const authMiddleware = require("./middleware/auth.middleware");

const app = express();

const rawClientUrl = process.env.CLIENT_URL || "";
const allowedOrigins = rawClientUrl
  ? rawClientUrl.split(",").map((url) => url.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "RAG API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/conversations", authMiddleware, conversationRoutes);

app.use("/api/documents", authMiddleware, documentRoutes);

app.use("/api/chat", authMiddleware, chatRoutes);

// Handle routes that do not exist
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  // Invalid JSON
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON format",
    });
  }

  // Multer file upload errors
  if (error.name === "MulterError") {
    const maxMb = process.env.MAX_FILE_SIZE_MB || 50;
    const msg =
      error.code === "LIMIT_FILE_SIZE"
        ? `File is too large. Maximum allowed file size is ${maxMb}MB.`
        : error.message;
    return res.status(400).json({
      message: msg,
    });
  }

  // File type validation errors
  if (error.message === "Only PDF files are allowed") {
    return res.status(400).json({
      message: error.message,
    });
  }

  // Unexpected errors
  console.error("Server error:", error);

  return res.status(error.status || 500).json({
    message: error.message || "Internal server error",
  });
});

module.exports = app;
