const express = require("express");
const router = express.Router();
const {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  respondToRequest,
  getFriends,
  getFriendTasks,
} = require("../controllers/friendController");
const authenticateToken = require("../middleware/auth");

router.get("/users/search", authenticateToken, searchUsers);
router.post("/friends/request", authenticateToken, sendFriendRequest);
router.get("/friends/requests", authenticateToken, getFriendRequests);
router.put("/friends/request/:id", authenticateToken, respondToRequest);
router.get("/friends", authenticateToken, getFriends);
router.get("/friends/:friendId/tasks", authenticateToken, getFriendTasks);

module.exports = router;
