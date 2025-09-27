import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Sample market insights overview data
    const overview = {
      timeRange: timeRange,
      summary: {
        totalMarketValue: 2.4e12, // $2.4 trillion
        growthRate: 8.7,
        activeMarkets: 54,
        tradingVolume: 1.8e11, // $180 billion
        topCommodities: [
          { name: 'Oil & Gas', value: 4.2e11, change: 12.3 },
          { name: 'Agricultural Products', value: 3.1e11, change: 8.9 },
          { name: 'Minerals & Metals', value: 2.8e11, change: -2.1 },
          { name: 'Textiles', value: 1.9e11, change: 15.6 },
          { name: 'Technology', value: 1.5e11, change: 22.4 }
        ]
      },
      regionalData: {
        africa: {
          marketValue: 8.5e11,
          growthRate: 12.1,
          topCountries: ['Nigeria', 'South Africa', 'Egypt', 'Kenya', 'Ghana'],
          keyIndustries: ['Oil & Gas', 'Agriculture', 'Mining', 'Textiles']
        },
        asia: {
          marketValue: 1.55e12,
          growthRate: 6.8,
          topCountries: ['China', 'India', 'Japan', 'South Korea', 'Singapore'],
          keyIndustries: ['Technology', 'Manufacturing', 'Agriculture', 'Energy']
        }
      },
      trends: [
        {
          title: 'Digital Trade Growth',
          description: 'E-commerce between Africa and Asia grew by 45% this quarter',
          impact: 'positive',
          confidence: 0.89
        },
        {
          title: 'Supply Chain Diversification',
          description: 'Companies are diversifying supply chains across multiple African countries',
          impact: 'positive',
          confidence: 0.76
        },
        {
          title: 'Green Energy Investments',
          description: 'Renewable energy projects seeing increased Asian investment in Africa',
          impact: 'positive',
          confidence: 0.82
        }
      ],
      opportunities: [
        {
          sector: 'Renewable Energy',
          potential: 'High',
          investmentRequired: 2.5e10,
          timeframe: '2-5 years',
          regions: ['East Africa', 'West Africa', 'Southeast Asia']
        },
        {
          sector: 'Agricultural Technology',
          potential: 'Very High',
          investmentRequired: 1.2e10,
          timeframe: '1-3 years',
          regions: ['Sub-Saharan Africa', 'South Asia']
        },
        {
          sector: 'Financial Services',
          potential: 'High',
          investmentRequired: 8e9,
          timeframe: '1-2 years',
          regions: ['Nigeria', 'Kenya', 'India', 'Indonesia']
        }
      ],
      risks: [
        {
          type: 'Political',
          level: 'Medium',
          description: 'Regulatory changes in key markets',
          mitigation: 'Diversify across multiple jurisdictions'
        },
        {
          type: 'Economic',
          level: 'Low',
          description: 'Currency fluctuations',
          mitigation: 'Use hedging instruments'
        },
        {
          type: 'Operational',
          level: 'Medium',
          description: 'Infrastructure limitations',
          mitigation: 'Partner with local infrastructure providers'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(overview);

  } catch (error) {
    console.error('Error fetching market insights overview:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
