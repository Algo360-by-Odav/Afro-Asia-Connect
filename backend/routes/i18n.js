const express = require('express');
const router = express.Router();
const i18nService = require('../services/i18nService');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/i18n/languages
// @desc    Get supported languages
// @access  Public
router.get('/languages', async (req, res) => {
  try {
    const languages = i18nService.getSupportedLanguages();
    res.json({
      success: true,
      languages
    });
  } catch (error) {
    console.error('❌ Error getting languages:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting supported languages',
      error: error.message
    });
  }
});

// @route   GET /api/i18n/translations/:langCode
// @desc    Get all translations for a language
// @access  Public
router.get('/translations/:langCode', async (req, res) => {
  try {
    const { langCode } = req.params;
    const translations = i18nService.getTranslations(langCode);
    
    res.json({
      success: true,
      language: langCode,
      translations
    });
  } catch (error) {
    console.error('❌ Error getting translations:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting translations',
      error: error.message
    });
  }
});

// @route   POST /api/i18n/translate
// @desc    Translate a key or text
// @access  Public
router.post('/translate', async (req, res) => {
  try {
    const { key, langCode = 'en', params = {} } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        msg: 'Translation key is required'
      });
    }

    const translation = i18nService.translate(key, langCode, params);
    
    res.json({
      success: true,
      key,
      language: langCode,
      translation,
      params
    });
  } catch (error) {
    console.error('❌ Error translating:', error);
    res.status(500).json({
      success: false,
      msg: 'Error translating text',
      error: error.message
    });
  }
});

// @route   GET /api/i18n/user/language
// @desc    Get user's preferred language
// @access  Private
router.get('/user/language', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const language = await i18nService.getUserLanguage(userId);
    
    res.json({
      success: true,
      userId,
      language
    });
  } catch (error) {
    console.error('❌ Error getting user language:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting user language',
      error: error.message
    });
  }
});

// @route   PUT /api/i18n/user/language
// @desc    Set user's preferred language
// @access  Private
router.put('/user/language', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { langCode } = req.body;
    
    if (!langCode) {
      return res.status(400).json({
        success: false,
        msg: 'Language code is required'
      });
    }

    await i18nService.setUserLanguage(userId, langCode);
    
    res.json({
      success: true,
      msg: 'Language preference updated',
      userId,
      language: langCode
    });
  } catch (error) {
    console.error('❌ Error setting user language:', error);
    res.status(500).json({
      success: false,
      msg: 'Error setting user language',
      error: error.message
    });
  }
});

// @route   POST /api/i18n/format
// @desc    Format values based on locale
// @access  Public
router.post('/format', async (req, res) => {
  try {
    const { type, value, langCode = 'en' } = req.body;
    
    if (!type || value === undefined) {
      return res.status(400).json({
        success: false,
        msg: 'Type and value are required'
      });
    }

    const formatted = i18nService.formatLocalized(type, value, langCode);
    
    res.json({
      success: true,
      type,
      originalValue: value,
      formattedValue: formatted,
      language: langCode
    });
  } catch (error) {
    console.error('❌ Error formatting value:', error);
    res.status(500).json({
      success: false,
      msg: 'Error formatting value',
      error: error.message
    });
  }
});

// @route   POST /api/i18n/detect-language
// @desc    Detect language from text
// @access  Public
router.post('/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        msg: 'Text is required'
      });
    }

    const detectedLanguage = await i18nService.detectLanguage(text);
    
    res.json({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      detectedLanguage
    });
  } catch (error) {
    console.error('❌ Error detecting language:', error);
    res.status(500).json({
      success: false,
      msg: 'Error detecting language',
      error: error.message
    });
  }
});

// @route   POST /api/i18n/auto-translate
// @desc    Auto-translate text using external service
// @access  Private (admin only)
router.post('/auto-translate', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: 'Access denied. Admin privileges required.'
      });
    }

    const { text, fromLang = 'en', toLang } = req.body;
    
    if (!text || !toLang) {
      return res.status(400).json({
        success: false,
        msg: 'Text and target language are required'
      });
    }

    const translation = await i18nService.autoTranslate(text, fromLang, toLang);
    
    res.json({
      success: true,
      originalText: text,
      fromLanguage: fromLang,
      toLanguage: toLang,
      translation
    });
  } catch (error) {
    console.error('❌ Error auto-translating:', error);
    res.status(500).json({
      success: false,
      msg: 'Error auto-translating text',
      error: error.message
    });
  }
});

// @route   PUT /api/i18n/translations/:langCode
// @desc    Update translation for a language (admin only)
// @access  Private
router.put('/translations/:langCode', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: 'Access denied. Admin privileges required.'
      });
    }

    const { langCode } = req.params;
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({
        success: false,
        msg: 'Key and value are required'
      });
    }

    await i18nService.updateTranslation(langCode, key, value);
    
    res.json({
      success: true,
      msg: 'Translation updated successfully',
      language: langCode,
      key,
      value
    });
  } catch (error) {
    console.error('❌ Error updating translation:', error);
    res.status(500).json({
      success: false,
      msg: 'Error updating translation',
      error: error.message
    });
  }
});

// @route   GET /api/i18n/content/:type/:id
// @desc    Get localized content
// @access  Public
router.get('/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { lang = 'en' } = req.query;
    
    const content = await i18nService.getLocalizedContent(type, id, lang);
    
    res.json({
      success: true,
      contentType: type,
      contentId: id,
      language: lang,
      content
    });
  } catch (error) {
    console.error('❌ Error getting localized content:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting localized content',
      error: error.message
    });
  }
});

module.exports = router;
