import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return basic subscription plans
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Basic profile',
          'Limited listings',
          'Standard support'
        ],
        popular: false
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 29,
        currency: 'USD',
        interval: 'month',
        features: [
          'Enhanced profile',
          'Unlimited listings',
          'Priority support',
          'Analytics dashboard',
          'Advanced messaging'
        ],
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Premium profile',
          'Unlimited everything',
          '24/7 dedicated support',
          'Advanced analytics',
          'Custom integrations',
          'White-label options'
        ],
        popular: false
      }
    ];

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
