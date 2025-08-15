const prisma = require('../prismaClient');

function listActive() {
  return prisma.businessListing.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

function getById(id) {
  return prisma.businessListing.findUnique({ where: { id: Number(id) } });
}

function listForUser(userId, { page = 1, limit = 10, category, sortBy = 'createdAt', sortOrder = 'desc' }) {
  userId = Number(userId);
  const skip = (page - 1) * limit;
  return prisma.businessListing.findMany({
    where: {
      userId,
      ...(category ? { businessCategory: category } : {}),
    },
    orderBy: { [sortBy]: sortOrder.toLowerCase() },
    skip,
    take: limit,
  });
}

function countForUser(userId, category) {
  userId = Number(userId);
  return prisma.businessListing.count({
    where: {
      userId,
      ...(category ? { businessCategory: category } : {}),
    },
  });
}

function create(userId, data) {
  const uid = Number(userId);
  return prisma.businessListing.create({
    data: {
      userId: uid,
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

async function update(listingId, userId, data) {
  const result = await prisma.businessListing.updateMany({
    where: { id: Number(listingId), userId: Number(userId) },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
  if (result.count === 0) return null;
  return prisma.businessListing.findUnique({ where: { id: Number(listingId) } });
}

function remove(listingId, userId) {
  return prisma.businessListing.delete({
    where: { id: Number(listingId), userId: Number(userId) },
  });
}

function statsForUser(userId) {
  userId = Number(userId);
  return prisma.businessListing.groupBy({
    by: ['isActive'],
    where: { userId },
    _count: { _all: true },
  }).then(rows => {
    const stats = { activeCount: 0, inactiveCount: 0 };
    rows.forEach(r => {
      if (r.isActive) stats.activeCount = r._count._all;
      else stats.inactiveCount = r._count._all;
    });
    return stats;
  });
}

module.exports = {
  listActive,
  getById,
  listForUser,
  countForUser,
  statsForUser,
  create,
  update,
  remove,
};
