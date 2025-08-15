const prisma = require('../prismaClient');

function getForProvider(providerId) {
  return prisma.workingHours.findMany({ where: { providerId: Number(providerId) } });
}

function upsertMany(providerId, entries) {
  // simple strategy: delete existing then createMany
  return prisma.$transaction([
    prisma.workingHours.deleteMany({ where: { providerId: Number(providerId) } }),
    prisma.workingHours.createMany({ data: entries.map((e) => ({ ...e, providerId: Number(providerId) })) }),
  ]);
}

module.exports = { getForProvider, upsertMany };
