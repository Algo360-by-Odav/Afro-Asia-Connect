const express = require('express');
const prisma = require('../prismaClient');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/companies
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || "";
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { industry: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { products: true }
    });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: Number(req.params.id) },
      include: { products: true }
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// POST /api/companies
router.post('/', async (req, res) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create company' });
  }
});

// PUT /api/companies/:id (update company – owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    // verify ownership: user is among company owners
    const owned = await prisma.company.findFirst({
      where: {
        id: companyId,
        owners: {
          some: { id: req.user.id },
        },
      },
    });
    if (!owned) return res.status(403).json({ msg: 'Not authorized to modify this company' });

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: req.body,
      include: { products: true },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update company' });
  }
});

// DELETE /api/companies/:id (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    const owned = await prisma.company.findFirst({
      where: {
        id: companyId,
        owners: { some: { id: req.user.id } },
      },
    });
    if (!owned) return res.status(403).json({ msg: 'Not authorized to delete this company' });

    await prisma.company.delete({ where: { id: companyId } });
    res.json({ msg: 'Company deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete company' });
  }
});

module.exports = router;
