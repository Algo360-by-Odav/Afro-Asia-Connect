const prisma = require('../prismaClient');

function list(ownerId, { category, q }) {
  return prisma.document.findMany({
    where: {
      ownerId: Number(ownerId),
      isActive: true, // Only show active versions
      ...(category ? { category } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: {
      children: { where: { isActive: true } },
      parent: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

function create(ownerId, data) {
  return prisma.document.create({
    data: { ownerId: Number(ownerId), ...data },
  });
}

async function replaceDocument(ownerId, documentId, newData) {
  // Get the current document
  const currentDoc = await prisma.document.findFirst({
    where: { id: Number(documentId), ownerId: Number(ownerId) },
  });
  
  if (!currentDoc) {
    throw new Error('Document not found');
  }

  // Find the root document (if current is already a version)
  const rootDoc = currentDoc.parentId ? 
    await prisma.document.findUnique({ where: { id: currentDoc.parentId } }) :
    currentDoc;

  // Get the highest version number
  const versions = await prisma.document.findMany({
    where: {
      OR: [
        { id: rootDoc.id },
        { parentId: rootDoc.id }
      ]
    },
    orderBy: { version: 'desc' }
  });

  const nextVersion = (versions[0]?.version || 0) + 1;

  // Mark current document as inactive
  await prisma.document.update({
    where: { id: Number(documentId) },
    data: { isActive: false }
  });

  // Create new version
  const newDoc = await prisma.document.create({
    data: {
      ownerId: Number(ownerId),
      title: newData.title || currentDoc.title,
      category: currentDoc.category,
      filename: newData.filename,
      mimeType: newData.mimeType,
      expiry: newData.expiry ? new Date(newData.expiry) : currentDoc.expiry,
      visibility: currentDoc.visibility,
      parentId: rootDoc.id,
      version: nextVersion,
      isActive: true,
    },
  });

  return newDoc;
}

function getVersionHistory(ownerId, documentId) {
  return prisma.document.findMany({
    where: {
      OR: [
        { id: Number(documentId), ownerId: Number(ownerId) },
        { parentId: Number(documentId), ownerId: Number(ownerId) }
      ]
    },
    orderBy: { version: 'desc' },
  });
}

module.exports = { list, create, replaceDocument, getVersionHistory };
