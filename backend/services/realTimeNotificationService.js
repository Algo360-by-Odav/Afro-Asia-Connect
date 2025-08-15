const { sendNotificationToUser } = require('../socket/socketHandler');
const prisma = require('../prismaClient');

class RealTimeNotificationService {
  
  // Send real-time notification for new messages
  static async notifyNewMessage(message, conversationParticipants) {
    try {
      // Notify all participants except the sender
      const notifications = conversationParticipants
        .filter(participant => participant.id !== message.senderId)
        .map(participant => ({
          userId: participant.id,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: `${message.sender.firstName || 'Someone'} sent you a message`,
          data: {
            conversationId: message.conversationId,
            messageId: message.id,
            senderId: message.senderId,
            senderName: message.sender.firstName || 'Unknown'
          },
          createdAt: new Date()
        }));

      // Save notifications to database
      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });

        // Send real-time notifications via Socket.IO
        notifications.forEach(notification => {
          sendNotificationToUser(notification.userId, {
            id: Date.now(), // Temporary ID
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            isRead: false
          });
        });
      }

      console.log(`[Notification] Sent ${notifications.length} message notifications`);
    } catch (error) {
      console.error('[Notification] Error sending message notifications:', error);
    }
  }

  // Send real-time notification for team invitations
  static async notifyTeamInvitation(invitation, team) {
    try {
      const notification = {
        userId: invitation.userId,
        type: 'TEAM_INVITATION',
        title: 'Team Invitation',
        message: `You've been invited to join ${team.name}`,
        data: {
          teamId: team.id,
          invitationId: invitation.id,
          teamName: team.name,
          role: invitation.role
        },
        createdAt: new Date()
      };

      // Save to database
      await prisma.notification.create({
        data: notification
      });

      // Send real-time notification
      sendNotificationToUser(invitation.userId, {
        ...notification,
        id: Date.now(),
        isRead: false
      });

      console.log(`[Notification] Sent team invitation notification to user ${invitation.userId}`);
    } catch (error) {
      console.error('[Notification] Error sending team invitation notification:', error);
    }
  }

  // Send real-time notification for subscription updates
  static async notifySubscriptionUpdate(userId, subscriptionData) {
    try {
      const notification = {
        userId: userId,
        type: 'SUBSCRIPTION_UPDATE',
        title: 'Subscription Updated',
        message: `Your subscription has been updated to ${subscriptionData.plan}`,
        data: {
          plan: subscriptionData.plan,
          status: subscriptionData.status,
          expiresAt: subscriptionData.expiresAt
        },
        createdAt: new Date()
      };

      // Save to database
      await prisma.notification.create({
        data: notification
      });

      // Send real-time notification
      sendNotificationToUser(userId, {
        ...notification,
        id: Date.now(),
        isRead: false
      });

      console.log(`[Notification] Sent subscription update notification to user ${userId}`);
    } catch (error) {
      console.error('[Notification] Error sending subscription notification:', error);
    }
  }

  // Send real-time notification for profile views
  static async notifyProfileView(profileOwnerId, viewerData) {
    try {
      const notification = {
        userId: profileOwnerId,
        type: 'PROFILE_VIEW',
        title: 'Profile Viewed',
        message: `${viewerData.firstName || 'Someone'} viewed your profile`,
        data: {
          viewerId: viewerData.id,
          viewerName: viewerData.firstName || 'Unknown',
          viewedAt: new Date()
        },
        createdAt: new Date()
      };

      // Save to database
      await prisma.notification.create({
        data: notification
      });

      // Send real-time notification
      sendNotificationToUser(profileOwnerId, {
        ...notification,
        id: Date.now(),
        isRead: false
      });

      console.log(`[Notification] Sent profile view notification to user ${profileOwnerId}`);
    } catch (error) {
      console.error('[Notification] Error sending profile view notification:', error);
    }
  }

  // Send real-time notification for new connections
  static async notifyNewConnection(userId, connectionData) {
    try {
      const notification = {
        userId: userId,
        type: 'NEW_CONNECTION',
        title: 'New Connection',
        message: `${connectionData.firstName || 'Someone'} wants to connect with you`,
        data: {
          connectionId: connectionData.id,
          connectionName: connectionData.firstName || 'Unknown',
          connectionEmail: connectionData.email
        },
        createdAt: new Date()
      };

      // Save to database
      await prisma.notification.create({
        data: notification
      });

      // Send real-time notification
      sendNotificationToUser(userId, {
        ...notification,
        id: Date.now(),
        isRead: false
      });

      console.log(`[Notification] Sent new connection notification to user ${userId}`);
    } catch (error) {
      console.error('[Notification] Error sending connection notification:', error);
    }
  }

  // Send real-time notification for system announcements
  static async notifySystemAnnouncement(userIds, announcementData) {
    try {
      const notifications = userIds.map(userId => ({
        userId: userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: announcementData.title || 'System Announcement',
        message: announcementData.message,
        data: {
          announcementId: announcementData.id,
          priority: announcementData.priority || 'normal',
          category: announcementData.category || 'general'
        },
        createdAt: new Date()
      }));

      // Save notifications to database
      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });

        // Send real-time notifications
        notifications.forEach(notification => {
          sendNotificationToUser(notification.userId, {
            ...notification,
            id: Date.now(),
            isRead: false
          });
        });
      }

      console.log(`[Notification] Sent system announcement to ${userIds.length} users`);
    } catch (error) {
      console.error('[Notification] Error sending system announcement:', error);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log(`[Notification] Marked notification ${notificationId} as read for user ${userId}`);
    } catch (error) {
      console.error('[Notification] Error marking notification as read:', error);
    }
  }

  // Get unread notification count for user
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('[Notification] Error getting unread count:', error);
      return 0;
    }
  }

  // Get recent notifications for user
  static async getRecentNotifications(userId, limit = 10) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return notifications;
    } catch (error) {
      console.error('[Notification] Error getting recent notifications:', error);
      return [];
    }
  }
}

module.exports = RealTimeNotificationService;
