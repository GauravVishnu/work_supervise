const express = require("express");
const router = express.Router();
const { saveSnapshot, getHistory, getStatsByDate, getTasksByDate } = require("../controllers/historyController");
const authenticateToken = require("../middleware/auth");

router.post("/history/snapshot", authenticateToken, saveSnapshot);
router.get("/history", authenticateToken, getHistory);
router.get("/history/stats", authenticateToken, getStatsByDate);
router.get("/history/date/:date", authenticateToken, getTasksByDate);

module.exports = router;
