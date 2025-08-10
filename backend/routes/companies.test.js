const request = require('supertest');
const app = require('../server');
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

// helper to create a test user and company
async function createUserAndToken() {
  const user = await prisma.user.create({
    data: { email: `test${Date.now()}@example.com`, password: 'hashed', role: 'SUPPLIER' },
  });
  const token = jwt.sign({ user: { id: user.id, email: user.email } }, process.env.JWT_SECRET);
  return { user, token };
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Company routes', () => {
  it('POST /api/companies should create company', async () => {
    const { token, user } = await createUserAndToken();

    const res = await request(app)
      .post('/api/companies')
      .send({ name: 'Test Co', industry: 'Tech', owners: { connect: { id: user.id } } })
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Co');
  });

  it('PUT /api/companies/:id should prevent non-owner', async () => {
    const { user } = await createUserAndToken();
    const other = await createUserAndToken();

    const company = await prisma.company.create({
      data: { name: 'Owned', owners: { connect: { id: user.id } } },
    });

    const res = await request(app)
      .put(`/api/companies/${company.id}`)
      .send({ name: 'Hacked' })
      .set('Cookie', [`token=${other.token}`]);

    expect(res.statusCode).toBe(403);
  });
});
