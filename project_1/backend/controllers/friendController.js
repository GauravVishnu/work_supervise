const pool = require("../config/db");

// Search users by email or name
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }

    const result = await pool.query(
      `SELECT udm_id, udm_name, udm_email 
       FROM public.user_details_m 
       WHERE (udm_email ILIKE $1 OR udm_name ILIKE $1) 
       AND udm_id != $2
       LIMIT 10`,
      [`%${query}%`, userId]
    );

    res.json({
      message: "Users found",
      users: result.rows,
    });

  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Send friend request
const sendFriendRequest = async (req, res) => {
  try {
    const { friendUserId } = req.body;
    const userId = req.user.id;

    console.log('Send friend request:', { userId, friendUserId, body: req.body });

    if (!friendUserId) {
      return res.status(400).json({ error: "Friend user ID required" });
    }

    if (userId === friendUserId) {
      return res.status(400).json({ error: "Cannot add yourself as friend" });
    }

    // Check if already friends or request exists
    const existing = await pool.query(
      `SELECT * FROM friends 
       WHERE (user_id = $1 AND friend_user_id = $2) 
       OR (user_id = $2 AND friend_user_id = $1)`,
      [userId, friendUserId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Friend request already exists" });
    }

    const result = await pool.query(
      `INSERT INTO friends (user_id, friend_user_id, status, created_by, created_on_client, created_on_server)
       VALUES ($1, $2, 'pending', $3, NOW(), NOW())
       RETURNING *`,
      [userId, friendUserId, "SYS001"]
    );

    res.status(201).json({
      message: "Friend request sent",
      request: result.rows[0],
    });

  } catch (err) {
    console.error("Send friend request error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get friend requests (pending)
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting friend requests for user:', userId);

    const result = await pool.query(
      `SELECT f.friend_id, f.user_id, f.status, f.created_on_server,
              u.udm_name, u.udm_email
       FROM friends f
       JOIN public.user_details_m u ON f.user_id = u.udm_id
       WHERE f.friend_user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_on_server DESC`,
      [userId]
    );

    console.log('Found requests:', result.rows.length);

    res.json({
      message: "Friend requests fetched",
      requests: result.rows,
    });

  } catch (err) {
    console.error("Get friend requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Accept/Reject friend request
const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user.id;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Valid status required" });
    }

    const result = await pool.query(
      `UPDATE friends 
       SET status = $1, modified_by = $2, modified_on_client = NOW(), modified_on_server = NOW()
       WHERE friend_id = $3 AND friend_user_id = $4
       RETURNING *`,
      [status, "SYS001", id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    res.json({
      message: `Friend request ${status}`,
      request: result.rows[0],
    });

  } catch (err) {
    console.error("Respond to request error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all friends
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
              CASE 
                WHEN f.user_id = $1 THEN f.friend_user_id 
                ELSE f.user_id 
              END as udm_id,
              u.udm_name, u.udm_email
       FROM friends f
       JOIN public.user_details_m u ON 
         (CASE 
           WHEN f.user_id = $1 THEN f.friend_user_id 
           ELSE f.user_id 
         END) = u.udm_id
       WHERE (f.user_id = $1 OR f.friend_user_id = $1) 
       AND f.status = 'accepted'
       ORDER BY u.udm_name`,
      [userId]
    );

    res.json({
      message: "Friends fetched",
      friends: result.rows,
    });

  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get friend's shared tasks
const getFriendTasks = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // Check if they are friends
    const friendCheck = await pool.query(
      `SELECT * FROM friends 
       WHERE ((user_id = $1 AND friend_user_id = $2) 
       OR (user_id = $2 AND friend_user_id = $1))
       AND status = 'accepted'`,
      [userId, friendId]
    );

    if (friendCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not friends with this user" });
    }

    // Get tasks shared with this user
    const result = await pool.query(
      `SELECT t.* FROM tasks t
       WHERE t.user_id = $1 
       AND (t.visibility = 'friends' 
            OR EXISTS (
              SELECT 1 FROM task_shares ts 
              WHERE ts.task_id = t.task_id 
              AND ts.shared_with_user_id = $2
            ))
       ORDER BY t.created_on_server DESC`,
      [friendId, userId]
    );

    res.json({
      message: "Friend tasks fetched",
      tasks: result.rows,
    });

  } catch (err) {
    console.error("Get friend tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  respondToRequest,
  getFriends,
  getFriendTasks,
};
