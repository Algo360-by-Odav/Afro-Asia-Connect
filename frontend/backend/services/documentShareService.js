const prisma = require('../prismaClient');

function createShare(ownerId, documentId, targetUserId, expiresAt) {
  return prisma.documentShare.create({
    data: {
      documentId: Number(documentId),
      targetUserId: Number(targetUserId),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { document: true, targetUser: true },
  });
}

function listSharesForDocument(ownerId, documentId) {
  return prisma.documentShare.findMany({
    where: { documentId: Number(documentId), document: { ownerId: Number(ownerId) } },
    include: { targetUser: { select: { id: true, firstName: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

function revokeShare(ownerId, shareId) {
  return prisma.documentShare.delete({
    where: { id: Number(shareId) },
  });
}

function listSharesForTarget(userId) {
  return prisma.documentShare.findMany({
    where: {
      targetUserId: Number(userId),
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: { document: true },
  });
}

function markViewed(shareId) {
  return prisma.documentShare.update({
    where: { id: Number(shareId) },
    data: { viewedAt: new Date() },
  });
}

module.exports = {
  createShare,
  listSharesForDocument,
  revokeShare,
  listSharesForTarget,
  markViewed,
};
