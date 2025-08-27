# AI Blurb Service Setup

The AI Blurb Service provides dynamic company spotlight descriptions using configurable AI providers with intelligent fallbacks.

## Environment Variables

Add these to your `.env` file in the backend directory:

```env
# AI Provider Configuration
AI_PROVIDER=fallback          # Options: 'openai', 'anthropic', 'gemini', 'fallback'
AI_API_KEY=your_api_key_here  # Required for AI providers (not needed for fallback)
```

## Supported AI Providers

### 1. OpenAI (GPT-3.5-turbo)
```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key
```

### 2. Anthropic Claude
```env
AI_PROVIDER=anthropic
AI_API_KEY=your-anthropic-api-key
```

### 3. Google Gemini
```env
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-api-key
```

### 4. Fallback Templates (Default)
```env
AI_PROVIDER=fallback
# No API key required
```

## How It Works

1. **Daily Spotlight Generation**: The spotlight rotation job runs daily at 00:10 server time
2. **AI Provider Priority**: If configured, attempts to use the specified AI provider first
3. **Intelligent Fallback**: If AI provider fails or is not configured, uses industry-specific templates
4. **Template Variety**: Multiple templates per industry ensure diverse descriptions
5. **Context Enhancement**: Adds location and trust score information when available

## Industry-Specific Templates

The fallback system includes tailored templates for:
- **Agro**: Agricultural and farming businesses
- **Manufacturing**: Industrial and production companies
- **Technology**: Software and tech service providers
- **Logistics**: Transportation and supply chain companies
- **Mining**: Extraction and mineral processing
- **Finance**: Financial services and trade finance
- **Default**: Generic professional services

## Testing

### Manual Refresh
Test the AI blurb generation:
```bash
POST http://localhost:3001/api/premium-news/spotlight/refresh
```

Response includes:
```json
{
  "success": true,
  "message": "Spotlight refreshed with AI-generated blurbs",
  "items": 3,
  "aiProvider": "fallback"
}
```

### View Generated Blurbs
```bash
GET http://localhost:3001/api/premium-news/spotlight
```

## Rate Limiting

- **OpenAI**: 100ms delay between requests
- **Anthropic**: 100ms delay between requests  
- **Gemini**: 100ms delay between requests
- **Fallback**: No delay (instant generation)

## Error Handling

- API failures automatically fall back to template generation
- Network errors are logged but don't break the spotlight rotation
- Invalid API keys trigger fallback mode
- All companies receive blurbs even if AI services are unavailable

## Cost Optimization

- Uses efficient models (GPT-3.5-turbo, Claude Haiku)
- Limited token output (100 tokens max)
- Only generates 3 blurbs daily
- Caches results in database to avoid regeneration

## Security

- API keys stored in environment variables only
- No API keys exposed in logs or responses
- Secure HTTPS connections to all AI providers
- Rate limiting prevents API abuse
