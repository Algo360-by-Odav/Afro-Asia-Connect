import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Sample market trends data
    const trends = {
      timeRange: timeRange,
      emergingTrends: [
        {
          id: 1,
          title: 'Digital Trade Platforms',
          description: 'Rise of B2B digital marketplaces connecting African and Asian businesses',
          category: 'Technology',
          impact: 'High',
          confidence: 0.87,
          growth: 156.7,
          timeframe: '6-12 months',
          regions: ['All regions'],
          keyDrivers: [
            'COVID-19 acceleration of digital adoption',
            'Improved internet infrastructure',
            'Government digitalization initiatives'
          ],
          implications: [
            'Reduced transaction costs',
            'Increased market access for SMEs',
            'Enhanced supply chain transparency'
          ]
        },
        {
          id: 2,
          title: 'Sustainable Supply Chains',
          description: 'Growing demand for environmentally responsible sourcing and production',
          category: 'Sustainability',
          impact: 'Very High',
          confidence: 0.92,
          growth: 89.3,
          timeframe: '12-24 months',
          regions: ['All regions'],
          keyDrivers: [
            'Consumer awareness',
            'Regulatory requirements',
            'Investor pressure'
          ],
          implications: [
            'Premium pricing for sustainable products',
            'New certification requirements',
            'Investment in green technologies'
          ]
        },
        {
          id: 3,
          title: 'Fintech Integration',
          description: 'Advanced financial technology solutions enabling cross-border payments',
          category: 'Financial Services',
          impact: 'High',
          confidence: 0.84,
          growth: 134.2,
          timeframe: '3-9 months',
          regions: ['West Africa', 'East Africa', 'Southeast Asia'],
          keyDrivers: [
            'Mobile money adoption',
            'Blockchain technology',
            'Regulatory sandboxes'
          ],
          implications: [
            'Faster payment settlements',
            'Lower transaction fees',
            'Improved financial inclusion'
          ]
        },
        {
          id: 4,
          title: 'Agricultural Technology',
          description: 'Smart farming and precision agriculture technologies gaining traction',
          category: 'Agriculture',
          impact: 'Medium',
          confidence: 0.76,
          growth: 67.8,
          timeframe: '12-18 months',
          regions: ['East Africa', 'South Asia'],
          keyDrivers: [
            'Climate change adaptation',
            'Food security concerns',
            'Technology cost reduction'
          ],
          implications: [
            'Increased crop yields',
            'Reduced environmental impact',
            'New business models'
          ]
        }
      ],
      sectorTrends: {
        'Energy': {
          trend: 'Renewable Energy Transition',
          growth: 78.4,
          keyDevelopments: [
            'Solar power cost reduction',
            'Grid modernization projects',
            'Energy storage solutions'
          ],
          investmentFlow: 2.3e10
        },
        'Manufacturing': {
          trend: 'Industry 4.0 Adoption',
          growth: 45.6,
          keyDevelopments: [
            'IoT integration',
            'Automation technologies',
            'Digital twins'
          ],
          investmentFlow: 1.8e10
        },
        'Healthcare': {
          trend: 'Telemedicine Expansion',
          growth: 234.5,
          keyDevelopments: [
            'Remote diagnostics',
            'Digital health platforms',
            'AI-powered solutions'
          ],
          investmentFlow: 8.7e9
        },
        'Education': {
          trend: 'EdTech Innovation',
          growth: 189.3,
          keyDevelopments: [
            'Online learning platforms',
            'Skills-based training',
            'Virtual reality applications'
          ],
          investmentFlow: 5.4e9
        }
      },
      disruptiveTechnologies: [
        {
          technology: 'Artificial Intelligence',
          adoptionRate: 34.7,
          applications: ['Supply chain optimization', 'Predictive analytics', 'Customer service'],
          timeline: '2-5 years'
        },
        {
          technology: 'Blockchain',
          adoptionRate: 18.9,
          applications: ['Trade finance', 'Supply chain tracking', 'Digital identity'],
          timeline: '3-7 years'
        },
        {
          technology: 'Internet of Things',
          adoptionRate: 42.1,
          applications: ['Smart logistics', 'Asset tracking', 'Predictive maintenance'],
          timeline: '1-3 years'
        },
        {
          technology: '5G Networks',
          adoptionRate: 23.6,
          applications: ['Real-time communication', 'Remote operations', 'Enhanced mobile services'],
          timeline: '2-4 years'
        }
      ],
      marketSignals: [
        {
          signal: 'Increased M&A Activity',
          strength: 'Strong',
          description: 'Rising merger and acquisition activity in cross-border deals',
          implications: ['Market consolidation', 'Technology transfer', 'Economies of scale']
        },
        {
          signal: 'Policy Harmonization',
          strength: 'Medium',
          description: 'Efforts to align trade policies between African and Asian countries',
          implications: ['Reduced trade barriers', 'Simplified procedures', 'Increased trade volume']
        },
        {
          signal: 'Infrastructure Investment',
          strength: 'Very Strong',
          description: 'Major infrastructure projects connecting Africa and Asia',
          implications: ['Reduced logistics costs', 'Faster delivery times', 'New trade routes']
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(trends);

  } catch (error) {
    console.error('Error fetching market trends:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
