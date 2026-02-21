const express = require("express");
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask } = require("../controllers/taskController");
const authenticateToken = require("../middleware/auth");

router.post("/tasks", authenticateToken, createTask);
router.get("/tasks", authenticateToken, getTasks);
router.put("/tasks/:id", authenticateToken, updateTask);
router.delete("/tasks/:id", authenticateToken, deleteTask);

module.exports = router;
