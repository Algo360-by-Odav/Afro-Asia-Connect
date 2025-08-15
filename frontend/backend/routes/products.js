const express = require('express');
const prisma = require('../prismaClient');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || "";
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { company: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: { company: true },
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { company: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id – only owner of associated company can modify
router.put('/:id', auth, async (req, res) => {
  try {
    const prodId = Number(req.params.id);
    // fetch product with company owners to verify
    const product = await prisma.product.findUnique({
      where: { id: prodId },
      include: { company: { include: { owners: true } } },
    });
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    const isOwner = product.company.owners.some((o) => o.id === req.user.id);
    if (!isOwner) return res.status(403).json({ msg: 'Not authorized to update this product' });

    const updated = await prisma.product.update({ where: { id: prodId }, data: req.body, include: { company: true } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id – only owner of associated company can delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const prodId = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: prodId },
      include: { company: { include: { owners: true } } },
    });
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    const isOwner = product.company.owners.some((o) => o.id === req.user.id);
    if (!isOwner) return res.status(403).json({ msg: 'Not authorized to delete this product' });

    await prisma.product.delete({ where: { id: prodId } });
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
