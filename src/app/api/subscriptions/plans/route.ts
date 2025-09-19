import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return subscription plans in the format expected by the frontend
    const plans = [
      {
        id: 1,
        name: 'Basic Connect',
        price: '0.00',
        currency: 'USD',
        duration_days: 30,
        features: [
          'Basic Company Profile',
          'Limited Directory Access',
          'Post up to 1 Request',
          'Community Forum Access'
        ],
        description: 'Perfect for getting started'
      },
      {
        id: 2,
        name: 'Premium Connect',
        price: '49.00',
        currency: 'USD',
        duration_days: 30,
        features: [
          'Enhanced Company Profile',
          'Full Directory Access',
          'Post up to 10 Requests',
          'Verified Badge',
          'Priority Support',
          'Access to Exclusive Events'
        ],
        description: 'Most popular choice for growing businesses'
      },
      {
        id: 3,
        name: 'Business Pro',
        price: '199.00',
        currency: 'USD',
        duration_days: 30,
        features: [
          'Premium Company Profile',
          'API Access for Integrations',
          'Unlimited Requests',
          'Dedicated Account Manager',
          'Custom Analytics & Reports',
          'Early Access to New Features'
        ],
        description: 'Enterprise-grade features for large organizations'
      }
    ];

    // Return the plans directly as an array, not wrapped in an object
    return NextResponse.json(plans);

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
