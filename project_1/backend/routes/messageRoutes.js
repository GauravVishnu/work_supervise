const express = require("express");
const router = express.Router();
const { getConversations, sendMessage, getMessages } = require("../controllers/messageController");
const authenticateToken = require("../middleware/auth");

router.get("/conversations", authenticateToken, getConversations);
router.post("/messages", authenticateToken, sendMessage);
router.get("/messages/:friendId", authenticateToken, getMessages);

module.exports = router;
