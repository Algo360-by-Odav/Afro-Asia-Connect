const prisma = require('../prismaClient');
const fs = require('fs').promises;
const path = require('path');

class I18nService {
  constructor() {
    this.supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
      { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
      { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' }
    ];
    
    this.translations = {};
    this.loadTranslations();
  }

  // Load all translation files
  async loadTranslations() {
    try {
      const translationsDir = path.join(__dirname, '../translations');
      
      // Create translations directory if it doesn't exist
      try {
        await fs.access(translationsDir);
      } catch {
        await fs.mkdir(translationsDir, { recursive: true });
        console.log('📁 Created translations directory');
      }

      // Load existing translation files
      for (const lang of this.supportedLanguages) {
        const filePath = path.join(translationsDir, `${lang.code}.json`);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          this.translations[lang.code] = JSON.parse(content);
        } catch (error) {
          // Create default translation file if it doesn't exist
          this.translations[lang.code] = await this.createDefaultTranslations(lang.code);
          await this.saveTranslationFile(lang.code);
        }
      }

      console.log(`🌍 Loaded translations for ${Object.keys(this.translations).length} languages`);

    } catch (error) {
      console.error('❌ Error loading translations:', error);
    }
  }

  // Create default translations for a language
  async createDefaultTranslations(langCode) {
    const baseTranslations = {
      // Common UI elements
      common: {
        welcome: 'Welcome',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information'
      },

      // Navigation
      navigation: {
        home: 'Home',
        services: 'Services',
        listings: 'Listings',
        companies: 'Companies',
        about: 'About',
        contact: 'Contact',
        help: 'Help',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service'
      },

      // Authentication
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        forgotPassword: 'Forgot Password?',
        resetPassword: 'Reset Password',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone Number',
        rememberMe: 'Remember Me',
        createAccount: 'Create Account',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
        invalidCredentials: 'Invalid email or password',
        accountCreated: 'Account created successfully',
        passwordReset: 'Password reset email sent'
      },

      // Services
      services: {
        title: 'Services',
        searchServices: 'Search Services',
        category: 'Category',
        location: 'Location',
        price: 'Price',
        rating: 'Rating',
        availability: 'Availability',
        bookNow: 'Book Now',
        viewDetails: 'View Details',
        serviceProvider: 'Service Provider',
        description: 'Description',
        reviews: 'Reviews',
        portfolio: 'Portfolio',
        contactProvider: 'Contact Provider'
      },

      // Bookings
      bookings: {
        title: 'Bookings',
        myBookings: 'My Bookings',
        bookingDetails: 'Booking Details',
        bookingDate: 'Booking Date',
        bookingTime: 'Booking Time',
        duration: 'Duration',
        totalAmount: 'Total Amount',
        status: 'Status',
        confirmed: 'Confirmed',
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled',
        reschedule: 'Reschedule',
        cancelBooking: 'Cancel Booking',
        payNow: 'Pay Now',
        downloadInvoice: 'Download Invoice'
      },

      // Messages
      messages: {
        title: 'Messages',
        newMessage: 'New Message',
        sendMessage: 'Send Message',
        typeMessage: 'Type your message...',
        attachFile: 'Attach File',
        conversations: 'Conversations',
        unreadMessages: 'Unread Messages',
        markAsRead: 'Mark as Read',
        deleteConversation: 'Delete Conversation',
        searchMessages: 'Search Messages'
      },

      // Reviews
      reviews: {
        title: 'Reviews',
        writeReview: 'Write Review',
        rating: 'Rating',
        reviewTitle: 'Review Title',
        reviewComment: 'Review Comment',
        submitReview: 'Submit Review',
        helpful: 'Helpful',
        reportReview: 'Report Review',
        providerResponse: 'Provider Response',
        verifiedPurchase: 'Verified Purchase',
        averageRating: 'Average Rating',
        totalReviews: 'Total Reviews'
      },

      // Notifications
      notifications: {
        title: 'Notifications',
        markAllRead: 'Mark All as Read',
        clearAll: 'Clear All',
        newBooking: 'New Booking',
        paymentReceived: 'Payment Received',
        messageReceived: 'Message Received',
        reviewReceived: 'Review Received',
        bookingConfirmed: 'Booking Confirmed',
        bookingCancelled: 'Booking Cancelled'
      },

      // Payments
      payments: {
        title: 'Payments',
        paymentMethod: 'Payment Method',
        cardNumber: 'Card Number',
        expiryDate: 'Expiry Date',
        cvv: 'CVV',
        billingAddress: 'Billing Address',
        paymentSuccessful: 'Payment Successful',
        paymentFailed: 'Payment Failed',
        refund: 'Refund',
        invoice: 'Invoice',
        paymentHistory: 'Payment History'
      },

      // Error messages
      errors: {
        general: 'Something went wrong. Please try again.',
        network: 'Network error. Please check your connection.',
        unauthorized: 'You are not authorized to perform this action.',
        notFound: 'The requested resource was not found.',
        validation: 'Please check your input and try again.',
        serverError: 'Server error. Please try again later.',
        sessionExpired: 'Your session has expired. Please log in again.'
      },

      // Success messages
      success: {
        saved: 'Changes saved successfully',
        deleted: 'Item deleted successfully',
        updated: 'Updated successfully',
        created: 'Created successfully',
        sent: 'Message sent successfully',
        uploaded: 'File uploaded successfully'
      }
    };

    // If not English, return base translations (will be translated later)
    if (langCode === 'en') {
      return baseTranslations;
    }

    // For other languages, we'll use the base English and mark for translation
    return baseTranslations;
  }

  // Get translation for a key
  translate(key, langCode = 'en', params = {}) {
    try {
      const keys = key.split('.');
      let translation = this.translations[langCode];

      if (!translation) {
        translation = this.translations['en']; // Fallback to English
      }

      for (const k of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k];
        } else {
          break;
        }
      }

      if (typeof translation !== 'string') {
        // Fallback to English if translation not found
        translation = this.translations['en'];
        for (const k of keys) {
          if (translation && typeof translation === 'object') {
            translation = translation[k];
          } else {
            break;
          }
        }
      }

      if (typeof translation !== 'string') {
        return key; // Return key if no translation found
      }

      // Replace parameters
      let result = translation;
      Object.keys(params).forEach(param => {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });

      return result;

    } catch (error) {
      console.error('❌ Translation error:', error);
      return key;
    }
  }

  // Get all translations for a language
  getTranslations(langCode = 'en') {
    return this.translations[langCode] || this.translations['en'];
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Update translation
  async updateTranslation(langCode, key, value) {
    try {
      if (!this.translations[langCode]) {
        this.translations[langCode] = {};
      }

      const keys = key.split('.');
      let current = this.translations[langCode];

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      // Save to file
      await this.saveTranslationFile(langCode);

      console.log(`✅ Updated translation ${key} for ${langCode}`);
      return true;

    } catch (error) {
      console.error('❌ Error updating translation:', error);
      throw error;
    }
  }

  // Save translation file
  async saveTranslationFile(langCode) {
    try {
      const translationsDir = path.join(__dirname, '../translations');
      const filePath = path.join(translationsDir, `${langCode}.json`);
      
      await fs.writeFile(
        filePath, 
        JSON.stringify(this.translations[langCode], null, 2), 
        'utf8'
      );

    } catch (error) {
      console.error(`❌ Error saving translation file for ${langCode}:`, error);
      throw error;
    }
  }

  // Auto-translate using a translation service (placeholder)
  async autoTranslate(text, fromLang = 'en', toLang) {
    try {
      // This would integrate with Google Translate, Azure Translator, or similar
      // For now, return the original text with a marker
      console.log(`🔄 Auto-translate requested: "${text}" from ${fromLang} to ${toLang}`);
      
      // Placeholder - in production, integrate with translation API
      return `[${toLang.toUpperCase()}] ${text}`;

    } catch (error) {
      console.error('❌ Auto-translation error:', error);
      return text;
    }
  }

  // Detect language from text (placeholder)
  async detectLanguage(text) {
    try {
      // This would integrate with language detection service
      // For now, return English as default
      console.log(`🔍 Language detection requested for: "${text.substring(0, 50)}..."`);
      
      return 'en'; // Placeholder

    } catch (error) {
      console.error('❌ Language detection error:', error);
      return 'en';
    }
  }

  // Get user's preferred language
  async getUserLanguage(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { preferredLanguage: true }
      });

      return user?.preferredLanguage || 'en';

    } catch (error) {
      console.error('❌ Error getting user language:', error);
      return 'en';
    }
  }

  // Set user's preferred language
  async setUserLanguage(userId, langCode) {
    try {
      if (!this.supportedLanguages.find(lang => lang.code === langCode)) {
        throw new Error('Unsupported language code');
      }

      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { preferredLanguage: langCode }
      });

      console.log(`✅ Set user ${userId} language to ${langCode}`);
      return true;

    } catch (error) {
      console.error('❌ Error setting user language:', error);
      throw error;
    }
  }

  // Get localized content (services, listings, etc.)
  async getLocalizedContent(contentType, contentId, langCode = 'en') {
    try {
      // This would fetch localized versions of content
      // For now, return indication that localization is available
      
      console.log(`🌍 Localized content requested: ${contentType}/${contentId} in ${langCode}`);
      
      return {
        available: true,
        language: langCode,
        fallbackLanguage: 'en'
      };

    } catch (error) {
      console.error('❌ Error getting localized content:', error);
      throw error;
    }
  }

  // Format numbers, dates, currency based on locale
  formatLocalized(type, value, langCode = 'en') {
    try {
      const locale = this.getLocaleFromLangCode(langCode);

      switch (type) {
        case 'currency':
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD' // This could be dynamic based on user/region
          }).format(value);

        case 'number':
          return new Intl.NumberFormat(locale).format(value);

        case 'date':
          return new Intl.DateTimeFormat(locale).format(new Date(value));

        case 'datetime':
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value));

        case 'relative':
          return new Intl.RelativeTimeFormat(locale).format(value.value, value.unit);

        default:
          return value;
      }

    } catch (error) {
      console.error('❌ Localization formatting error:', error);
      return value;
    }
  }

  // Convert language code to locale
  getLocaleFromLangCode(langCode) {
    const localeMap = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'sw': 'sw-KE',
      'am': 'am-ET',
      'yo': 'yo-NG'
    };

    return localeMap[langCode] || 'en-US';
  }
}

module.exports = new I18nService();
