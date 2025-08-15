const prisma = require('../prismaClient');

function listForUser(userId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;
  return prisma.service.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      user: {
        include: {
          companies: {
            select: { name: true },
            take: 1,
          },
        },
      },
    },
  });
}

function listPublic({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    select: {
      id: true,
      serviceName: true,
      serviceCategory: true,
      price: true,
      isActive: true,
    },
  });
}

function countPublic() {
  return prisma.service.count({ where: { isActive: true } });
}

function countForUser(userId) {
  return prisma.service.count({ where: { userId: Number(userId) } });
}

function create(userId, data) {
  return prisma.service.create({
    data: {
      userId: Number(userId),
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

async function update(serviceId, userId, data) {
  const result = await prisma.service.updateMany({
    where: { id: Number(serviceId), userId: Number(userId) },
    data: { ...data, updatedAt: new Date() },
  });
  if (result.count === 0) return null;
  return prisma.service.findUnique({ where: { id: Number(serviceId) } });
}

async function findUnique(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: Number(serviceId) },
    include: {
      user: {
        include: {
          companies: {
            take: 1,
            include: {
              reviews: {
                include: {
                  reviewer: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              },
              products: true
            }
          }
        }
      }
    }
  });

  if (!service) return null;

  // Get the first company (take: 1 above)
  const company = service.user.companies[0];
  // If provider hasn't created a company profile yet, return a placeholder object
  const safeCompany = company || {
    id: null,
    name: 'N/A',
    location: 'N/A',
    description: '',
    verified: false,
    trustScore: 0,
    yearFounded: null,
    website: '',
    whatsapp: '',
    linkedin: '',
    products: [],
    reviews: [],
  };

  // Calculate average rating
  const reviews = company ? company.reviews || [] : [];
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Remove companies array to avoid confusion and attach single company obj
  const formattedService = {
    ...service,
    user: {
      ...service.user,
      companies: undefined,
      company: {
        ...safeCompany,
        averageRating,
      },
    },
  };

  return formattedService;
}

function updateCompany(userId, data) {
  return prisma.company.updateMany({
    where: {
      owners: {
        some: {
          id: Number(userId),
        },
      },
    },
    data,
  });
}

function remove(serviceId, userId) {
  return prisma.service.delete({
    where: { id: Number(serviceId), userId: Number(userId) },
  });
}

module.exports = { listPublic, countPublic, listForUser, countForUser, create, update, updateCompany, remove, findUnique };
