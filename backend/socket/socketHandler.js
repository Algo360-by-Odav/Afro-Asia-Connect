const { Server } = require('socket.io');
const messagingService = require('../services/messagingService');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://afroasia-connect.netlify.app",
        process.env.FRONTEND_URL || "https://afroasia-connect.netlify.app"
      ],
      credentials: true
    }
  });

  // Store user socket connections
  const userSockets = new Map();
  const connectedUsers = new Map(); // Track connected users
  const onlineUsers = new Set(); // Track online user IDs

  io.on('connection', (socket) => {
    console.log('[Socket] User connected:', socket.id);

    // User joins with their ID
    socket.on('join', (userId) => {
      socket.userId = userId;
      userSockets.set(userId, socket.id);
      connectedUsers.set(socket.id, userId);
      onlineUsers.add(userId);
      
      // Broadcast user online status
      socket.broadcast.emit('user_status_change', {
        userId,
        isOnline: true
      });
      
      socket.join(`user_${userId}`);
      console.log(`[Socket] User ${userId} joined and is now online`);
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`[Socket] User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, content, messageType = 'TEXT', fileUrl, fileName } = data;
        
        // Save message to database
        const message = await messagingService.sendMessage(
          conversationId, senderId, content, messageType, fileUrl, fileName
        );

        // Emit to all users in the conversation
        io.to(`conversation_${conversationId}`).emit('new_message', message);
        
        console.log(`[Socket] Message sent in conversation ${conversationId}`);
      } catch (error) {
        console.error('[Socket] Error sending message:', error);
        const errorData = {
          error: 'Failed to send message',
          details: error?.message || 'Unknown error details',
          conversationId: data?.conversationId || 'Unknown conversation',
          errorType: error?.name || 'Unknown error type',
          timestamp: new Date().toISOString()
        };
        console.log('[Socket] Emitting message_error with data:', errorData);
        socket.emit('message_error', errorData);
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, userId } = data;
        await messagingService.markMessagesAsRead(conversationId, userId);
        
        // Notify other users in conversation
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId,
          userId
        });
        
        console.log(`[Socket] Messages marked as read in conversation ${conversationId}`);
      } catch (error) {
        console.error('[Socket] Error marking messages as read:', error);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId, userId, userName } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userName,
        isTyping: true
      });
      console.log(`[Socket] User ${userId} started typing in conversation ${conversationId}`);
    });

    socket.on('typing_stop', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false
      });
      console.log(`[Socket] User ${userId} stopped typing in conversation ${conversationId}`);
    });

    // Get online users
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(onlineUsers));
    });

    // User typing indicator
    socket.on('typing', (data) => {
      const { conversationId, userId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        isTyping
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        
        // Check if user has other connections
        const hasOtherConnections = Array.from(connectedUsers.values()).includes(userId);
        if (!hasOtherConnections) {
          onlineUsers.delete(userId);
          
          // Broadcast user offline status
          socket.broadcast.emit('user_status_change', {
            userId,
            isOnline: false
          });
        }
        
        console.log(`[Socket] User ${userId} disconnected`);
      }
      console.log('[Socket] User disconnected');
    });
  });

  return io;
}

// Function to send notification to specific user
function sendNotificationToUser(userId, notification) {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
}

module.exports = {
  initializeSocket,
  sendNotificationToUser,
};
