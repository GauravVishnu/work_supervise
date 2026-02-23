const pool = require("../config/db");

// Get conversations list
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get conversations from messages
    const messagesResult = await pool.query(
      `SELECT 
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as friend_id,
        u.udm_name, u.udm_email,
        COALESCE(u.is_online, false) as is_online,
        u.last_seen,
        m.message as last_message,
        m.created_on_server as last_message_time,
        m.sender_id as last_sender_id,
        0 as unread_count
      FROM messages m
      JOIN public.user_details_m u ON 
        (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) = u.udm_id
      WHERE m.message_id IN (
        SELECT MAX(message_id) FROM messages 
        WHERE sender_id = $1 OR receiver_id = $1
        GROUP BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
      )
      GROUP BY friend_id, u.udm_name, u.udm_email, u.is_online, u.last_seen, m.message, m.created_on_server, m.sender_id
      ORDER BY m.created_on_server DESC`,
      [userId]
    );

    // If no messages, show friends list instead
    if (messagesResult.rows.length === 0) {
      const friendsResult = await pool.query(
        `SELECT 
          CASE WHEN f.user_id = $1 THEN f.friend_user_id ELSE f.user_id END as friend_id,
          u.udm_name, u.udm_email,
          COALESCE(u.is_online, false) as is_online,
          u.last_seen,
          'Start a conversation' as last_message,
          NOW() as last_message_time,
          NULL as last_sender_id,
          0 as unread_count
        FROM friends f
        JOIN public.user_details_m u ON 
          (CASE WHEN f.user_id = $1 THEN f.friend_user_id ELSE f.user_id END) = u.udm_id
        WHERE (f.user_id = $1 OR f.friend_user_id = $1) AND f.status = true
        ORDER BY u.udm_name`,
        [userId]
      );
      
      return res.json({
        message: "Conversations fetched",
        conversations: friendsResult.rows,
      });
    }

    res.json({
      message: "Conversations fetched",
      conversations: messagesResult.rows,
    });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message) {
      return res.status(400).json({ error: "Receiver and message required" });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, created_by, created_on_client, created_on_server)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [senderId, receiverId, message, "SYS001"]
    );

    res.status(201).json({
      message: "Message sent",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get messages with incremental fetch
const getMessages = async (req, res) => {
  try {
    const { friendId } = req.params;
    const { after } = req.query; // timestamp for incremental fetch
    const userId = req.user.id;

    let query = `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
       OR (sender_id = $2 AND receiver_id = $1)`;
    
    const params = [userId, friendId];
    
    if (after) {
      query += ` AND created_on_server > $3`;
      params.push(after);
    }
    
    query += ` ORDER BY created_on_server ASC`;

    const result = await pool.query(query, params);

    res.json({
      message: "Messages fetched",
      messages: result.rows,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getConversations, sendMessage, getMessages };
