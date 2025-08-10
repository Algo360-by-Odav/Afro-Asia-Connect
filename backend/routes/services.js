const express = require('express');
const router = express.Router();
const serviceService = require('../services/serviceService');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/services/my-services
router.get('/my-services', authMiddleware, async (req, res) => {
  try {
    if (req.user.user_type !== 'service_provider') {
      return res.status(403).json({ msg: 'Only service providers can access their services.' });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const [services, totalCount] = await Promise.all([
      serviceService.listForUser(req.user.id, { page, limit }),
      serviceService.countForUser(req.user.id),
    ]);
    res.json({
      services,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (e) {
    console.error('Error fetching services:', e);
    res.status(500).json({ msg: 'Server error while fetching services.' });
  }
});

// GET /api/services (public list)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  try {
    const services = await serviceService.listPublic({ page, limit });
    // Return simple array to match current frontend expectation
    res.json(services);
  } catch (e) {
    console.error('Error fetching public services:', e);
    res.status(500).json({ msg: 'Server error while fetching services.' });
  }
});

// POST /api/services
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.user_type !== 'service_provider') {
    return res.status(403).json({ msg: 'Only service providers can create services.' });
  }
  const { service_name, service_category, description, price, is_active } = req.body;
  if (!service_name || !service_category) {
    return res.status(400).json({ msg: 'Service name and category are required.' });
  }
  try {
    const created = await serviceService.create(req.user.id, {
      serviceName: service_name,
      serviceCategory: service_category,
      description,
      price: price ? Number(price) : null,
      isActive: typeof is_active === 'boolean' ? is_active : true,
    });

    const { website, linkedin, yearFounded, whatsapp } = req.body;
    if (website || linkedin || yearFounded || whatsapp) {
      await serviceService.updateCompany(req.user.id, {
        website,
        linkedin,
        yearFounded: yearFounded ? Number(yearFounded) : undefined,
        whatsapp,
      });
    }

    res.status(201).json(created);
  } catch (e) {
    console.error('Error creating service:', e);
    res.status(500).json({ msg: 'Server error while creating service.' });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  const serviceId = Number(req.params.id);
  if (Number.isNaN(serviceId)) return res.status(400).json({ msg: 'Invalid service ID.' });
  
  try {
    const service = await serviceService.findUnique(serviceId);
    if (!service) return res.status(404).json({ msg: 'Service not found.' });
    res.json(service);
  } catch (e) {
    console.error('Error fetching service:', e);
    res.status(500).json({ msg: 'Server error while fetching service.' });
  }
});

// PUT /api/services/:id
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.user_type !== 'service_provider') {
    return res.status(403).json({ msg: 'Only service providers can update services.' });
  }
  const serviceId = Number(req.params.id);
  if (Number.isNaN(serviceId)) return res.status(400).json({ msg: 'Invalid service ID.' });
  try {
    const {
      service_name,
      service_category,
      description,
      price,
      is_active,
      isActive, // allow camelCase too
    } = req.body;
    const data = {};
    if (service_name) data.serviceName = service_name;
    if (service_category) data.serviceCategory = service_category;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price === null ? null : Number(price);
    if (typeof is_active === 'boolean') data.isActive = is_active;
    if (typeof isActive === 'boolean') data.isActive = isActive;
    const updated = await serviceService.update(serviceId, req.user.id, data);
    if (!updated) return res.status(404).json({ msg: 'Service not found.' });

    const { website, linkedin, yearFounded, whatsapp } = req.body;
    if (website || linkedin || yearFounded || whatsapp) {
      await serviceService.updateCompany(req.user.id, {
        website,
        linkedin,
        yearFounded: yearFounded ? Number(yearFounded) : undefined,
        whatsapp,
      });
    }

    res.json(updated);
  } catch (e) {
    console.error('Error updating service:', e);
    res.status(500).json({ msg: 'Server error while updating service.' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.user_type !== 'service_provider') {
    return res.status(403).json({ msg: 'Only service providers can delete services.' });
  }
  const serviceId = Number(req.params.id);
  if (Number.isNaN(serviceId)) return res.status(400).json({ msg: 'Invalid service ID.' });
  try {
    await serviceService.remove(serviceId, req.user.id);
    res.json({ msg: 'Service deleted.' });
  } catch (e) {
    console.error('Error deleting service:', e);
    res.status(404).json({ msg: 'Service not found.' });
  }
});

module.exports = router;
