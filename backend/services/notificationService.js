const prisma = require('../prismaClient');

/**
 * Fetch notifications for a user ordered newest first.
 * @param {number} userId
 */
async function listForUser(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Mark a notification as read for the given user.
 * Returns the updated notification or null if not found.
 * @param {number} notificationId
 * @param {number} userId
 */
async function markRead(notificationId, userId) {
  return prisma.notification.updateMany({
    where: { id: Number(notificationId), userId },
    data: { isRead: true, updatedAt: new Date() },
  });
}

module.exports = {
  listForUser,
  markRead,
};
