const jwt = require('jsonwebtoken');
const pool = require('./config/db');

const userSockets = new Map(); // userId -> socketId
const typingUsers = new Map(); // conversationKey -> Set of userIds

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Authenticate user
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        userSockets.set(decoded.id, socket.id);
        
        // Update user online status
        await pool.query(
          'UPDATE public.user_details_m SET is_online = true, last_seen = NOW() WHERE udm_id = $1',
          [decoded.id]
        );
        
        // Notify friends user is online
        const friends = await pool.query(
          `SELECT CASE WHEN user_id = $1 THEN friend_user_id ELSE user_id END as friend_id
           FROM friends WHERE (user_id = $1 OR friend_user_id = $1) AND status = true`,
          [decoded.id]
        );
        
        friends.rows.forEach(f => {
          const friendSocketId = userSockets.get(f.friend_id);
          if (friendSocketId) {
            io.to(friendSocketId).emit('user_online', { userId: decoded.id });
          }
        });
        
        console.log('User authenticated:', decoded.id);
      } catch (err) {
        console.error('Auth error:', err);
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;
        const senderId = socket.userId;

        const result = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, message, status, created_by, created_on_client, created_on_server)
           VALUES ($1, $2, $3, 'sent', 'SYS001', NOW(), NOW())
           RETURNING *`,
          [senderId, parseInt(receiverId), message]
        );

        const msg = result.rows[0];

        // Send to receiver if online
        const receiverSocketId = userSockets.get(parseInt(receiverId));
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', msg);
          
          // Update status to delivered
          await pool.query(
            'UPDATE messages SET status = $1 WHERE message_id = $2',
            ['delivered', msg.message_id]
          );
          msg.status = 'delivered';
        }

        // Send back to sender with updated status
        socket.emit('message_sent', msg);

      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      const receiverSocketId = userSockets.get(parseInt(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId: socket.userId,
          isTyping
        });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { senderId } = data;
        const receiverId = socket.userId;

        await pool.query(
          `UPDATE messages SET status = 'read' 
           WHERE sender_id = $1 AND receiver_id = $2 AND status != 'read'`,
          [parseInt(senderId), receiverId]
        );

        // Notify sender
        const senderSocketId = userSockets.get(parseInt(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { userId: receiverId });
        }
      } catch (err) {
        console.error('Mark read error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        
        // Update user offline status
        await pool.query(
          'UPDATE public.user_details_m SET is_online = false, last_seen = NOW() WHERE udm_id = $1',
          [socket.userId]
        );
        
        // Notify friends user is offline
        const friends = await pool.query(
          `SELECT CASE WHEN user_id = $1 THEN friend_user_id ELSE user_id END as friend_id
           FROM friends WHERE (user_id = $1 OR friend_user_id = $1) AND status = true`,
          [socket.userId]
        );
        
        friends.rows.forEach(f => {
          const friendSocketId = userSockets.get(f.friend_id);
          if (friendSocketId) {
            io.to(friendSocketId).emit('user_offline', { userId: socket.userId });
          }
        });
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
};
