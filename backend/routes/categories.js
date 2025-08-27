const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// GET /api/categories -> list active categories
router.get('/', async (req, res) => {
  try {
    const items = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, items, total: items.length });
  } catch (err) {
    console.error('[categories] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// POST /api/categories/seed -> seed defaults if table empty (idempotent)
router.post('/seed', async (req, res) => {
  try {
    const existing = await prisma.category.count();
    if (existing > 0) {
      return res.json({ success: true, message: 'Categories already seeded', count: existing });
    }

    const defaults = [
      { name: 'Agro', slug: 'agro' },
      { name: 'Manufacturing', slug: 'manufacturing' },
      { name: 'Services', slug: 'services' },
      { name: 'Technology', slug: 'technology' },
      { name: 'Logistics', slug: 'logistics' },
      { name: 'Finance', slug: 'finance' },
      { name: 'Mining', slug: 'mining' },
      { name: 'Inspection', slug: 'inspection' },
      { name: 'Spices', slug: 'spices' },
    ];

    const created = await prisma.category.createMany({ data: defaults, skipDuplicates: true });
    res.json({ success: true, message: 'Seeded categories', created: created.count });
  } catch (err) {
    console.error('[categories] seed error:', err);
    res.status(500).json({ success: false, error: 'Failed to seed categories' });
  }
});

module.exports = router;
