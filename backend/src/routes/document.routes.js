const express = require("express");

const upload = require("../middleware/upload.middleware");

const controller = require("../controllers/document.controller");

const router = express.Router();

router.post("/upload", upload.single("pdf"),controller.uploadDocument);

module.exports = router;