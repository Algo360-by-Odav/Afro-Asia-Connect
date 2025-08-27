const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { runOnce: ensureSpotlightForToday } = require('../jobs/spotlightRotationJob');

function toUTCDateOnly(d) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Mock premium companies data
const premiumCompanies = [
  {
    id: "c1",
    name: "Kano Agro Exports",
    logo: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=200&q=60",
    plan: "premium",
    isFeatured: true,
    industry: "Agro-Export",
    productFocus: "Sesame & Cashew",
    country: "Nigeria",
    region: "Africa",
    blurb: "Leading exporter of high-quality sesame and cashew to Southeast Asia with robust QC.",
    profileUrl: "/company/kano-agro-exports",
    contactUrl: "/messages/new?to=c1",
    views: 245,
    updatedAt: "2025-08-10T09:00:00Z",
  },
  {
    id: "c2",
    name: "Penang Freight Hub",
    logo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&q=60",
    plan: "premium",
    isFeatured: false,
    industry: "Logistics",
    productFocus: "Multimodal Shipping",
    country: "Malaysia",
    region: "Asia",
    blurb: "Licensed freight forwarder offering customs brokerage and multimodal solutions across APAC.",
    profileUrl: "/company/penang-freight-hub",
    contactUrl: "/messages/new?to=c2",
    views: 410,
    updatedAt: "2025-08-14T12:00:00Z",
  },
  {
    id: "c3",
    name: "Accra Quality Inspectors",
    logo: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&q=60",
    plan: "premium",
    isFeatured: true,
    industry: "Inspection",
    productFocus: "Pre-shipment QC",
    country: "Ghana",
    region: "Africa",
    blurb: "Third-party inspection and loading supervision for agro commodities.",
    profileUrl: "/company/accra-qc",
    contactUrl: "/messages/new?to=c3",
    views: 160,
    updatedAt: "2025-08-18T08:00:00Z",
  },
  {
    id: "c4",
    name: "Saigon Trade Finance",
    logo: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=200&q=60",
    plan: "premium",
    isFeatured: false,
    industry: "Finance",
    productFocus: "Letters of Credit",
    country: "Vietnam",
    region: "Asia",
    blurb: "Fintech-enabled LC handling and supply chain finance for cross-border trade.",
    profileUrl: "/company/saigon-trade-finance",
    contactUrl: "/messages/new?to=c4",
    views: 520,
    updatedAt: "2025-08-16T11:00:00Z",
  },
  {
    id: "c5",
    name: "Lagos Port Services",
    logo: "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=200&q=60",
    plan: "premium",
    isFeatured: false,
    industry: "Port Handling",
    productFocus: "Bulk Cargo",
    country: "Nigeria",
    region: "Africa",
    blurb: "End-to-end port handling and warehousing for exporters across West Africa.",
    profileUrl: "/company/lagos-port-services",
    contactUrl: "/messages/new?to=c5",
    views: 95,
    updatedAt: "2025-08-12T10:00:00Z",
  },
  {
    id: "c6",
    name: "Bangkok Tech Solutions",
    logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=60",
    plan: "premium",
    isFeatured: false,
    industry: "Technology",
    productFocus: "Supply Chain Software",
    country: "Thailand",
    region: "Asia",
    blurb: "Cloud-based supply chain management and tracking solutions for cross-border trade.",
    profileUrl: "/company/bangkok-tech",
    contactUrl: "/messages/new?to=c6",
    views: 330,
    updatedAt: "2025-08-15T14:00:00Z",
  },
  {
    id: "c7",
    name: "Cape Town Minerals",
    logo: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&q=60",
    plan: "premium",
    isFeatured: true,
    industry: "Mining",
    productFocus: "Precious Metals",
    country: "South Africa",
    region: "Africa",
    blurb: "Certified precious metals trader with direct mining partnerships across Southern Africa.",
    profileUrl: "/company/cape-town-minerals",
    contactUrl: "/messages/new?to=c7",
    views: 180,
    updatedAt: "2025-08-17T16:00:00Z",
  },
  {
    id: "c8",
    name: "Jakarta Spice Traders",
    logo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=60",
    plan: "premium",
    isFeatured: false,
    industry: "Spices",
    productFocus: "Organic Spices",
    country: "Indonesia",
    region: "Asia",
    blurb: "Premium organic spice exporter with sustainable farming partnerships across Indonesia.",
    profileUrl: "/company/jakarta-spice",
    contactUrl: "/messages/new?to=c8",
    views: 275,
    updatedAt: "2025-08-13T11:00:00Z",
  }
];

function rotateFeatured(list) {
  // simple rotation: mark top 3 by views as featured today
  list.sort((a,b) => (b.views||0)-(a.views||0));
  list.forEach((x, i) => (x.isFeatured = i < 3));
  const now = new Date().toISOString();
  list.forEach(x => (x.updatedAt = now));
}

// Search / filter endpoint powering the News page
router.get('/', (req, res) => {
  try {
    const { q = "", industry = "", country = "", featured } = req.query;
    let items = premiumCompanies.map(c => ({ ...c }));
    
    if (featured) items = items.filter(i => i.isFeatured);
    if (industry) items = items.filter(i => i.industry.toLowerCase() === industry.toLowerCase());
    if (country) items = items.filter(i => i.country.toLowerCase() === country.toLowerCase());
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(qq) ||
        i.industry.toLowerCase().includes(qq) ||
        i.country.toLowerCase().includes(qq)
      );
    }
    
    // Sort latest first by updatedAt
    items.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json({ 
      success: true,
      items,
      total: items.length 
    });
  } catch (error) {
    console.error('Error fetching premium news:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch premium news' 
    });
  }
});

// Increment views when a profile is clicked
router.post('/view', (req, res) => {
  try {
    const { id } = req.body || {};
    const item = premiumCompanies.find(x => x.id === id);
    if (item) {
      item.views = (item.views || 0) + 1;
      res.json({ 
        success: true, 
        views: item.views 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Company not found' 
      });
    }
  } catch (error) {
    console.error('Error updating views:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update views' 
    });
  }
});

// Rotate featured companies (can be called manually or via cron)
router.post('/rotate-featured', (req, res) => {
  try {
    rotateFeatured(premiumCompanies);
    res.json({ 
      success: true, 
      message: 'Featured companies rotated successfully' 
    });
  } catch (error) {
    console.error('Error rotating featured companies:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to rotate featured companies' 
    });
  }
});

// New: DB-backed spotlight for 3 companies per day
router.get('/spotlight', async (req, res) => {
  try {
    // Ensure today's spotlight exists
    await ensureSpotlightForToday(new Date());

    const day = toUTCDateOnly(new Date());
    const { userId, industryInterest } = req.query;

    let spots = await prisma.spotlight.findMany({
      where: { date: day },
      orderBy: { position: 'asc' },
      include: { company: true },
    });

    // Personalization: reorder by industry preference if provided
    if (industryInterest && typeof industryInterest === 'string') {
      spots = spots.sort((a, b) => {
        const aMatch = a.company?.industry?.toLowerCase().includes(industryInterest.toLowerCase()) ? 1 : 0;
        const bMatch = b.company?.industry?.toLowerCase().includes(industryInterest.toLowerCase()) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch; // Preferred industry first
        return a.position - b.position; // Keep original order for ties
      });
    }

    const items = spots.map(s => ({
      id: `spot-${s.id}`,
      position: s.position,
      blurb: s.blurb,
      company: {
        id: s.companyId,
        name: s.company?.name,
        industry: s.company?.industry || '',
        location: s.company?.location || '',
        description: s.company?.description || '',
        averageRating: s.company?.averageRating || 0,
        trustScore: s.company?.trustScore || 0,
      },
    }));
    const respDate = spots[0]?.date ? new Date(spots[0].date).toISOString().slice(0,10) : day.toISOString().slice(0,10);
    res.json({ success: true, items, total: items.length, date: respDate, personalized: !!industryInterest });
  } catch (error) {
    console.error('[premium-news] spotlight error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch spotlight' });
  }
});

// Optional: Manual refresh endpoint (for testing/admin)
router.post('/spotlight/refresh', async (req, res) => {
  try {
    const { runOnce } = require('../jobs/spotlightRotationJob');
    const result = await runOnce(new Date());
    res.json({ 
      success: true, 
      message: 'Spotlight refreshed with AI-generated blurbs', 
      items: result.length,
      aiProvider: process.env.AI_PROVIDER || 'fallback'
    });
  } catch (error) {
    console.error('[premium-news] spotlight refresh error:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh spotlight' });
  }
});

module.exports = router;
