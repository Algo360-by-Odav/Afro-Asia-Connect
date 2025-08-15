const prisma = require('../prismaClient');

async function get(providerId) {
  const id = Number(providerId);
  let cfg = await prisma.providerConfig.findUnique({ where: { providerId: id } });
  if (!cfg) {
    cfg = await prisma.providerConfig.create({ data: { providerId: id } });
  }
  return cfg;
}

function update(providerId, data) {
  return prisma.providerConfig.upsert({
    where: { providerId: Number(providerId) },
    update: data,
    create: { providerId: Number(providerId), ...data },
  });
}

module.exports = { get, update };
