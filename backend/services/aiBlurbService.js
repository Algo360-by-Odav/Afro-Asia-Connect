const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'fallback'; // 'openai', 'anthropic', 'gemini', 'fallback'
const AI_API_KEY = process.env.AI_API_KEY;

// Fallback templates for different industries
const FALLBACK_TEMPLATES = {
  'agro': [
    'Leading agricultural producer specializing in sustainable farming practices and premium crop exports.',
    'Innovative agro-business connecting farmers with global markets through quality assurance and fair trade.',
    'Established agricultural cooperative providing high-quality produce with full traceability and certification.'
  ],
  'manufacturing': [
    'Modern manufacturing facility with state-of-the-art equipment and international quality standards.',
    'Industrial manufacturer specializing in precision engineering and custom solutions for global clients.',
    'Established production company with decades of experience in manufacturing excellence and innovation.'
  ],
  'technology': [
    'Cutting-edge technology solutions provider with expertise in digital transformation and innovation.',
    'Software development company specializing in scalable solutions for modern business challenges.',
    'Tech consultancy offering comprehensive digital services and custom software development.'
  ],
  'logistics': [
    'Comprehensive logistics solutions provider with extensive network coverage and reliable service.',
    'International freight and logistics company specializing in cross-border trade facilitation.',
    'End-to-end supply chain management with advanced tracking and efficient delivery systems.'
  ],
  'mining': [
    'Responsible mining operation with sustainable extraction practices and environmental compliance.',
    'Mineral processing company with advanced technology and international safety standards.',
    'Mining enterprise focused on ethical sourcing and community development initiatives.'
  ],
  'finance': [
    'Financial services provider specializing in trade finance and international payment solutions.',
    'Banking institution offering comprehensive financial products for business growth and expansion.',
    'Investment and financing company supporting international trade and business development.'
  ],
  'default': [
    'Established business with strong market presence and commitment to quality service delivery.',
    'Professional service provider with extensive experience and proven track record of success.',
    'Industry leader known for reliability, innovation, and customer-focused solutions.'
  ]
};

/**
 * Generate AI blurb for a company using configured provider or fallback
 * @param {Object} company - Company object with name, industry, description, etc.
 * @returns {Promise<string>} Generated blurb
 */
async function generateBlurb(company) {
  try {
    // Try AI provider first if configured
    if (AI_PROVIDER !== 'fallback' && AI_API_KEY) {
      const aiBlurb = await generateAIBlurb(company);
      if (aiBlurb) {
        console.log(`[AI Blurb] Generated using ${AI_PROVIDER} for ${company.name}`);
        return aiBlurb;
      }
    }
    
    // Fallback to template-based generation
    const fallbackBlurb = generateFallbackBlurb(company);
    console.log(`[AI Blurb] Using fallback template for ${company.name}`);
    return fallbackBlurb;
    
  } catch (error) {
    console.error(`[AI Blurb] Error generating blurb for ${company.name}:`, error);
    return generateFallbackBlurb(company);
  }
}

/**
 * Generate blurb using AI provider
 * @param {Object} company - Company object
 * @returns {Promise<string|null>} AI-generated blurb or null if failed
 */
async function generateAIBlurb(company) {
  const prompt = `Write a professional 2-sentence business spotlight blurb for this company:
Name: ${company.name}
Industry: ${company.industry || 'Business'}
Location: ${company.location || 'International'}
Description: ${company.description || 'Professional services company'}

The blurb should be engaging, highlight key strengths, and be suitable for a business news spotlight. Keep it concise and professional.`;

  try {
    switch (AI_PROVIDER.toLowerCase()) {
      case 'openai':
        return await generateOpenAIBlurb(prompt);
      case 'anthropic':
        return await generateAnthropicBlurb(prompt);
      case 'gemini':
        return await generateGeminiBlurb(prompt);
      default:
        return null;
    }
  } catch (error) {
    console.warn(`[AI Blurb] ${AI_PROVIDER} provider failed:`, error.message);
    return null;
  }
}

/**
 * OpenAI API integration
 */
async function generateOpenAIBlurb(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim();
}

/**
 * Anthropic Claude API integration
 */
async function generateAnthropicBlurb(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': AI_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.content[0]?.text?.trim();
}

/**
 * Google Gemini API integration
 */
async function generateGeminiBlurb(prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${AI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text?.trim();
}

/**
 * Generate fallback blurb using templates
 * @param {Object} company - Company object
 * @returns {string} Template-based blurb
 */
function generateFallbackBlurb(company) {
  const industry = company.industry?.toLowerCase() || 'default';
  const templates = FALLBACK_TEMPLATES[industry] || FALLBACK_TEMPLATES.default;
  
  // Select template based on company ID for consistency
  const templateIndex = (company.id || 0) % templates.length;
  let blurb = templates[templateIndex];
  
  // Add location context if available
  if (company.location) {
    blurb = `Based in ${company.location}, this ${blurb.toLowerCase()}`;
  }
  
  // Add trust score context if high
  if (company.trustScore && company.trustScore >= 90) {
    blurb += ' With an exceptional trust score, they maintain the highest standards of business excellence.';
  } else if (company.trustScore && company.trustScore >= 80) {
    blurb += ' Known for reliability and maintaining strong business partnerships.';
  }
  
  return blurb;
}

/**
 * Batch generate blurbs for multiple companies
 * @param {Array} companies - Array of company objects
 * @returns {Promise<Array>} Array of companies with generated blurbs
 */
async function generateBatchBlurbs(companies) {
  const results = [];
  
  for (const company of companies) {
    try {
      const blurb = await generateBlurb(company);
      results.push({ ...company, blurb });
      
      // Add small delay to respect API rate limits
      if (AI_PROVIDER !== 'fallback') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`[AI Blurb] Failed to generate blurb for ${company.name}:`, error);
      results.push({ ...company, blurb: generateFallbackBlurb(company) });
    }
  }
  
  return results;
}

module.exports = {
  generateBlurb,
  generateBatchBlurbs,
  generateFallbackBlurb
};
