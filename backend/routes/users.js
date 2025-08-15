const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get all users (for testing messaging)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      take: 50, // Limit to 50 users
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Failed', error: err.message });
  }
});

module.exports = router;
