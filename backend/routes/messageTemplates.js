const express = require('express');
const messageTemplateService = require('../services/messageTemplateService');
const router = express.Router();

// Get user's templates
router.get('/', async (req, res) => {
  try {
    const { userId, category } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const templates = await messageTemplateService.getUserTemplates(userId, category);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const { userId, title, content, category } = req.body;
    
    if (!userId || !title || !content) {
      return res.status(400).json({ error: 'userId, title, and content are required' });
    }
    
    const template = await messageTemplateService.createTemplate(userId, title, content, category);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, content, category } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    
    const template = await messageTemplateService.updateTemplate(id, userId, updates);
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    await messageTemplateService.deleteTemplate(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Use template (increment usage count)
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const template = await messageTemplateService.useTemplate(id, userId);
    res.json(template);
  } catch (error) {
    console.error('Error using template:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

// Create default templates for user
router.post('/default', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const templates = await messageTemplateService.createDefaultTemplates(userId);
    res.status(201).json(templates);
  } catch (error) {
    console.error('Error creating default templates:', error);
    res.status(500).json({ error: 'Failed to create default templates' });
  }
});

module.exports = router;
