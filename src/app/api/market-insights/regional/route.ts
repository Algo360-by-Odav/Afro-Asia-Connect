import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Sample regional market insights data
    const regionalData = {
      timeRange: timeRange,
      regions: {
        'West Africa': {
          countries: ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Mali'],
          marketValue: 3.2e11,
          growthRate: 14.2,
          keyIndustries: ['Oil & Gas', 'Agriculture', 'Mining', 'Textiles'],
          tradingPartners: ['China', 'India', 'UAE', 'Turkey'],
          opportunities: [
            'Agricultural processing',
            'Renewable energy',
            'Digital payments',
            'Logistics infrastructure'
          ],
          challenges: [
            'Infrastructure gaps',
            'Regulatory complexity',
            'Currency volatility'
          ]
        },
        'East Africa': {
          countries: ['Kenya', 'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda'],
          marketValue: 2.8e11,
          growthRate: 11.7,
          keyIndustries: ['Agriculture', 'Tourism', 'Technology', 'Manufacturing'],
          tradingPartners: ['China', 'India', 'Japan', 'South Korea'],
          opportunities: [
            'Coffee and tea exports',
            'Tech innovation hubs',
            'Manufacturing zones',
            'Tourism development'
          ],
          challenges: [
            'Political stability',
            'Infrastructure development',
            'Skills gap'
          ]
        },
        'Southern Africa': {
          countries: ['South Africa', 'Botswana', 'Zambia', 'Zimbabwe', 'Namibia'],
          marketValue: 2.5e11,
          growthRate: 8.9,
          keyIndustries: ['Mining', 'Agriculture', 'Manufacturing', 'Financial Services'],
          tradingPartners: ['China', 'India', 'Japan', 'Singapore'],
          opportunities: [
            'Mining technology',
            'Financial services',
            'Wine exports',
            'Automotive assembly'
          ],
          challenges: [
            'Energy security',
            'Economic inequality',
            'Infrastructure maintenance'
          ]
        },
        'Southeast Asia': {
          countries: ['Indonesia', 'Thailand', 'Vietnam', 'Malaysia', 'Philippines'],
          marketValue: 8.7e11,
          growthRate: 7.3,
          keyIndustries: ['Manufacturing', 'Technology', 'Agriculture', 'Tourism'],
          tradingPartners: ['Nigeria', 'South Africa', 'Kenya', 'Ghana'],
          opportunities: [
            'Electronics manufacturing',
            'Palm oil processing',
            'Tourism services',
            'Digital economy'
          ],
          challenges: [
            'Supply chain disruptions',
            'Environmental concerns',
            'Competition from China'
          ]
        },
        'South Asia': {
          countries: ['India', 'Bangladesh', 'Pakistan', 'Sri Lanka'],
          marketValue: 6.9e11,
          growthRate: 9.1,
          keyIndustries: ['Technology', 'Textiles', 'Pharmaceuticals', 'Agriculture'],
          tradingPartners: ['Nigeria', 'South Africa', 'Kenya', 'Egypt'],
          opportunities: [
            'IT services',
            'Pharmaceutical exports',
            'Textile manufacturing',
            'Agricultural technology'
          ],
          challenges: [
            'Regulatory compliance',
            'Quality standards',
            'Logistics costs'
          ]
        }
      },
      crossRegionalTrends: [
        {
          trend: 'Digital Payment Adoption',
          regions: ['West Africa', 'East Africa', 'Southeast Asia'],
          growth: 67.3,
          impact: 'Facilitating easier cross-border transactions'
        },
        {
          trend: 'Green Energy Transition',
          regions: ['Southern Africa', 'South Asia'],
          growth: 45.8,
          impact: 'Creating new investment opportunities'
        },
        {
          trend: 'Supply Chain Regionalization',
          regions: ['All regions'],
          growth: 23.4,
          impact: 'Reducing dependency on traditional routes'
        }
      ],
      tradeFlows: [
        {
          from: 'West Africa',
          to: 'South Asia',
          volume: 4.2e10,
          mainProducts: ['Oil', 'Cocoa', 'Gold'],
          growth: 18.7
        },
        {
          from: 'East Africa',
          to: 'Southeast Asia',
          volume: 2.8e10,
          mainProducts: ['Coffee', 'Tea', 'Flowers'],
          growth: 22.1
        },
        {
          from: 'Southeast Asia',
          to: 'Southern Africa',
          volume: 3.5e10,
          mainProducts: ['Electronics', 'Textiles', 'Machinery'],
          growth: 15.3
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(regionalData);

  } catch (error) {
    console.error('Error fetching regional market insights:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
