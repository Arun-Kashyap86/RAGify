const express = require("express");

const controller = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", controller.chat);

module.exports = router;