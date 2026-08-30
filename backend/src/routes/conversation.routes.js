const express = require("express");

const controller = require("../controllers/conversation.controller");

const router = express.Router();

router.post("/",controller.createConversation);

router.get("/",controller.getConversations);

router.get("/:id", controller.getConversation);

router.delete("/:id",controller.deleteConversation);

module.exports = router;