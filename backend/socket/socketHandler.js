const { Server } = require('socket.io');
const messagingService = require('../services/messagingService');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:60752",
        "https://afroasia-connect.netlify.app",
        process.env.FRONTEND_URL || "https://afroasia-connect.netlify.app"
      ],
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  // Store user socket connections
  const userSockets = new Map();
  const connectedUsers = new Map(); // Track connected users
  const onlineUsers = new Set(); // Track online user IDs

  io.on('connection', (socket) => {
    console.log('[Socket] User connected:', socket.id);

    // Join user to their personal room for notifications
    socket.on('join_user', (userId) => {
      const numericUserId = Number(userId);
      socket.userId = numericUserId;
      socket.join(`user_${numericUserId}`);
      console.log(`[Socket] User ${numericUserId} joined and is now online`);

      // Track connection by socket and by user
      connectedUsers.set(socket.id, numericUserId);
      if (!userSockets.has(numericUserId)) {
        userSockets.set(numericUserId, new Set());
      }
      userSockets.get(numericUserId).add(socket.id);

      // Mark user online
      onlineUsers.add(numericUserId);

      // Notify others and share full online list
      socket.broadcast.emit('user_status_change', { userId: numericUserId, isOnline: true });
      io.emit('online_users', Array.from(onlineUsers));
    });

    // Explicit presence ping from frontend
    socket.on('user_online', (userId) => {
      const numericUserId = Number(userId);
      if (!Number.isNaN(numericUserId)) {
        // If socket not associated yet, associate
        if (!socket.userId) {
          socket.userId = numericUserId;
          connectedUsers.set(socket.id, numericUserId);
          if (!userSockets.has(numericUserId)) {
            userSockets.set(numericUserId, new Set());
          }
          userSockets.get(numericUserId).add(socket.id);
          socket.join(`user_${numericUserId}`);
        }
        if (!onlineUsers.has(numericUserId)) {
          console.log(`[Socket] Marking user ${numericUserId} online via user_online`);
        }
        onlineUsers.add(numericUserId);
        socket.broadcast.emit('user_status_change', { userId: numericUserId, isOnline: true });
        io.emit('online_users', Array.from(onlineUsers));
      }
    });

    // Test connection handler
    socket.on('test_connection', (data) => {
      console.log('[Socket] Test connection received from frontend:', data);
      socket.emit('test_response', { 
        message: 'Backend received test connection', 
        timestamp: new Date().toISOString(),
        originalData: data 
      });
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      const roomName = `conversation_${conversationId}`;
      socket.join(roomName);
      console.log(`[Socket] User ${socket.userId} joined conversation ${conversationId}`);
      
      // Debug: List all rooms for this socket
      console.log(`[Socket] User ${socket.userId} is now in rooms:`, Array.from(socket.rooms));
      
      // Debug: Count users in conversation room
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      console.log(`[Socket] Conversation ${conversationId} now has ${roomSize} users`);
      
      // Debug: List all socket IDs in this conversation room
      const roomSockets = io.sockets.adapter.rooms.get(roomName);
      if (roomSockets) {
        console.log(`[Socket] Socket IDs in conversation ${conversationId}:`, Array.from(roomSockets));
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, content, messageType = 'TEXT', fileUrl, fileName } = data;
        
        // Save message to database
        const message = await messagingService.sendMessage(
          conversationId, senderId, content, messageType, fileUrl, fileName
        );

        // Debug: Check who's in the conversation room
        const roomName = `conversation_${conversationId}`;
        const roomUsers = io.sockets.adapter.rooms.get(roomName);
        const roomUserIds = roomUsers ? Array.from(roomUsers) : [];
        console.log(`[Socket] Conversation ${conversationId} has users:`, roomUserIds);
        
        // Additional debugging: Check if sender is in the room
        const senderInRoom = roomUsers ? roomUsers.has(socket.id) : false;
        console.log(`[Socket] Sender ${senderId} (${socket.id}) is in room: ${senderInRoom}`);
        
        // Emit to all users in the conversation
        io.to(roomName).emit('new_message', message);
        
        // Also emit to sender to confirm message was sent
        socket.emit('message_sent', { messageId: message.id, conversationId });
        
        console.log(`[Socket] Message sent in conversation ${conversationId} to ${roomUserIds.length} users`, {
          messageId: message.id,
          content: message.content.substring(0, 50) + '...',
          roomSize: roomUserIds.length
        });
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
      if (userId !== undefined) {
        // Remove this socket from user's socket set
        const set = userSockets.get(userId);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            userSockets.delete(userId);
          }
        }

        connectedUsers.delete(socket.id);

        // Check if user has other active sockets
        const hasOtherConnections = userSockets.has(userId) && userSockets.get(userId).size > 0;
        if (!hasOtherConnections) {
          if (onlineUsers.has(userId)) {
            onlineUsers.delete(userId);
          }
          // Broadcast user offline status and updated online list
          socket.broadcast.emit('user_status_change', {
            userId,
            isOnline: false
          });
          io.emit('online_users', Array.from(onlineUsers));
        }

        console.log(`[Socket] User ${userId} disconnected (remaining sockets: ${userSockets.get(userId)?.size || 0})`);
      }
      console.log('[Socket] Socket disconnected:', socket.id);
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

