import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Sample market categories data
    const categories = {
      timeRange: timeRange,
      categories: [
        {
          id: 'agriculture',
          name: 'Agriculture & Food',
          marketValue: 4.2e11,
          growthRate: 12.8,
          subcategories: [
            {
              name: 'Grains & Cereals',
              value: 1.8e11,
              growth: 8.4,
              topProducts: ['Rice', 'Wheat', 'Maize', 'Millet']
            },
            {
              name: 'Cash Crops',
              value: 1.1e11,
              growth: 18.7,
              topProducts: ['Coffee', 'Cocoa', 'Cotton', 'Tea']
            },
            {
              name: 'Processed Foods',
              value: 9.2e10,
              growth: 15.3,
              topProducts: ['Canned goods', 'Beverages', 'Snacks', 'Dairy']
            },
            {
              name: 'Livestock',
              value: 4.1e10,
              growth: 6.9,
              topProducts: ['Cattle', 'Poultry', 'Fish', 'Dairy products']
            }
          ],
          keyTrends: [
            'Organic farming adoption',
            'Climate-smart agriculture',
            'Value chain integration'
          ],
          challenges: [
            'Climate change impact',
            'Post-harvest losses',
            'Market access barriers'
          ]
        },
        {
          id: 'energy',
          name: 'Energy & Natural Resources',
          marketValue: 3.8e11,
          growthRate: 9.7,
          subcategories: [
            {
              name: 'Oil & Gas',
              value: 2.1e11,
              growth: 5.2,
              topProducts: ['Crude oil', 'Natural gas', 'Refined products', 'LNG']
            },
            {
              name: 'Renewable Energy',
              value: 8.7e10,
              growth: 34.6,
              topProducts: ['Solar panels', 'Wind turbines', 'Hydroelectric', 'Biomass']
            },
            {
              name: 'Mining',
              value: 7.8e10,
              growth: 3.1,
              topProducts: ['Gold', 'Diamonds', 'Copper', 'Iron ore']
            },
            {
              name: 'Coal',
              value: 3.2e10,
              growth: -8.4,
              topProducts: ['Thermal coal', 'Coking coal', 'Coal products']
            }
          ],
          keyTrends: [
            'Energy transition',
            'Carbon neutrality goals',
            'Grid modernization'
          ],
          challenges: [
            'Environmental regulations',
            'Price volatility',
            'Infrastructure needs'
          ]
        },
        {
          id: 'manufacturing',
          name: 'Manufacturing & Industrial',
          marketValue: 2.9e11,
          growthRate: 11.4,
          subcategories: [
            {
              name: 'Textiles & Apparel',
              value: 1.2e11,
              growth: 14.8,
              topProducts: ['Cotton textiles', 'Garments', 'Footwear', 'Accessories']
            },
            {
              name: 'Electronics',
              value: 8.9e10,
              growth: 19.3,
              topProducts: ['Smartphones', 'Computers', 'Components', 'Appliances']
            },
            {
              name: 'Automotive',
              value: 5.4e10,
              growth: 7.6,
              topProducts: ['Vehicles', 'Parts', 'Tires', 'Batteries']
            },
            {
              name: 'Machinery',
              value: 4.2e10,
              growth: 9.1,
              topProducts: ['Industrial equipment', 'Agricultural machinery', 'Construction equipment']
            }
          ],
          keyTrends: [
            'Industry 4.0 adoption',
            'Automation increase',
            'Sustainable manufacturing'
          ],
          challenges: [
            'Skills gap',
            'Technology adoption',
            'Supply chain disruptions'
          ]
        },
        {
          id: 'services',
          name: 'Services & Technology',
          marketValue: 1.8e11,
          growthRate: 22.3,
          subcategories: [
            {
              name: 'Financial Services',
              value: 7.2e10,
              growth: 28.4,
              topProducts: ['Banking', 'Insurance', 'Investment', 'Fintech']
            },
            {
              name: 'IT Services',
              value: 5.8e10,
              growth: 31.7,
              topProducts: ['Software development', 'Cloud services', 'Cybersecurity', 'Data analytics']
            },
            {
              name: 'Logistics',
              value: 3.1e10,
              growth: 16.9,
              topProducts: ['Shipping', 'Warehousing', 'Last-mile delivery', 'Supply chain']
            },
            {
              name: 'Consulting',
              value: 1.7e10,
              growth: 12.5,
              topProducts: ['Business consulting', 'Technical advisory', 'Legal services', 'Market research']
            }
          ],
          keyTrends: [
            'Digital transformation',
            'Remote service delivery',
            'AI integration'
          ],
          challenges: [
            'Regulatory compliance',
            'Data privacy',
            'Talent retention'
          ]
        },
        {
          id: 'healthcare',
          name: 'Healthcare & Pharmaceuticals',
          marketValue: 1.2e11,
          growthRate: 18.6,
          subcategories: [
            {
              name: 'Pharmaceuticals',
              value: 6.8e10,
              growth: 21.3,
              topProducts: ['Generic drugs', 'Vaccines', 'Medical devices', 'Diagnostics']
            },
            {
              name: 'Medical Equipment',
              value: 3.4e10,
              growth: 15.7,
              topProducts: ['Imaging equipment', 'Surgical instruments', 'Monitoring devices']
            },
            {
              name: 'Telemedicine',
              value: 1.8e10,
              growth: 45.2,
              topProducts: ['Remote consultations', 'Digital health platforms', 'Health apps']
            }
          ],
          keyTrends: [
            'Telemedicine expansion',
            'Personalized medicine',
            'AI in diagnostics'
          ],
          challenges: [
            'Regulatory approval',
            'Quality standards',
            'Access barriers'
          ]
        }
      ],
      crossCategoryTrends: [
        {
          trend: 'Digitalization',
          affectedCategories: ['All categories'],
          impact: 'Transformative',
          timeline: '2-5 years'
        },
        {
          trend: 'Sustainability Focus',
          affectedCategories: ['Energy', 'Manufacturing', 'Agriculture'],
          impact: 'High',
          timeline: '3-7 years'
        },
        {
          trend: 'Supply Chain Resilience',
          affectedCategories: ['Manufacturing', 'Agriculture', 'Healthcare'],
          impact: 'Medium',
          timeline: '1-3 years'
        }
      ],
      investmentOpportunities: [
        {
          category: 'Renewable Energy',
          opportunity: 'Solar manufacturing in Africa',
          potential: 'Very High',
          investmentSize: '1-5 billion USD'
        },
        {
          category: 'Agriculture',
          opportunity: 'Agtech solutions for smallholder farmers',
          potential: 'High',
          investmentSize: '100-500 million USD'
        },
        {
          category: 'Healthcare',
          opportunity: 'Pharmaceutical manufacturing hubs',
          potential: 'High',
          investmentSize: '500 million - 2 billion USD'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(categories);

  } catch (error) {
    console.error('Error fetching market categories:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
