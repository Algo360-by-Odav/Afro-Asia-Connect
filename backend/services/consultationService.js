const prisma = require('../prismaClient');

function listForProvider(providerId) {
  return prisma.consultation.findMany({
    where: { providerId: Number(providerId) },
    include: { buyer: true, notes: true, feedback: true },
    orderBy: { start: 'desc' },
  });
}

function create(data) {
  return prisma.consultation.create({ data });
}

function update(id, data) {
  return prisma.consultation.update({
    where: { id: Number(id) },
    data,
  });
}

function updateStatus(id, status, videoLink) {
  return update(id, { status, videoLink });
}

function listHistoryForProvider(providerId) {
  return prisma.consultation.findMany({
    where: {
      providerId: Number(providerId),
      end: { lt: new Date() },
    },
    include: { buyer: true, feedback: true },
    orderBy: { end: 'desc' },
  });
}

function addFeedback(consultationId, rating, comment) {
  return prisma.feedback.upsert({
    where: { consultationId: Number(consultationId) },
    update: { rating, comment },
    create: { consultationId: Number(consultationId), rating, comment },
  });
}

function addNote(consultationId, authorId, text) {
  return prisma.consultationNote.create({
    data: { consultationId: Number(consultationId), authorId: Number(authorId), text },
  });
}

module.exports = {
  listForProvider,
  create,
  updateStatus,
  update,
  listHistoryForProvider,
  addFeedback,
  addNote,
};
