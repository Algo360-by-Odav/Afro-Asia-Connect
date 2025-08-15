const request = require('supertest');
const app = require('../server');
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

// helper to create user and token
async function createUserAndToken() {
  const user = await prisma.user.create({
    data: {
      email: `u${Date.now()}@example.com`,
      password: 'hashed',
      role: 'SUPPLIER',
    },
  });
  const token = jwt.sign({ user: { id: user.id, email: user.email } }, process.env.JWT_SECRET);
  return { user, token };
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Product routes', () => {
  it('POST /api/products should create product', async () => {
    const { user, token } = await createUserAndToken();
    // create company for user
    const company = await prisma.company.create({
      data: {
        name: 'ProdCo',
        owners: { connect: { id: user.id } },
      },
    });

    const res = await request(app)
      .post('/api/products')
      .send({ title: 'Widget', companyId: company.id, category: 'Gadgets', images: [] })
      .set('Cookie', [`token=${token}`]); // token not required by route but fine

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Widget');
    expect(res.body.companyId).toBe(company.id);
  });

  it('PUT /api/products/:id should prevent non-owner', async () => {
    const owner = await createUserAndToken();
    const other = await createUserAndToken();

    const company = await prisma.company.create({
      data: { name: 'OwnerCo', owners: { connect: { id: owner.user.id } } },
    });

    const product = await prisma.product.create({
      data: { title: 'Thing', companyId: company.id, category: 'Misc', images: [] },
    });

    const res = await request(app)
      .put(`/api/products/${product.id}`)
      .send({ title: 'Hacked' })
      .set('Cookie', [`token=${other.token}`]);

    expect(res.statusCode).toBe(403);
  });
});
