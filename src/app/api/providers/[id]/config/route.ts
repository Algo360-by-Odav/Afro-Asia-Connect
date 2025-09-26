import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Sample provider configuration
    const config = {
      providerId: id,
      businessName: 'Professional Consulting Services',
      description: 'Expert business consulting for international trade and market expansion',
      specializations: ['Business Strategy', 'Market Research', 'Trade Documentation'],
      languages: ['English', 'Mandarin', 'French'],
      experience: '10+ years',
      certifications: ['ISO 9001', 'Export License', 'Business Consultant Certification'],
      pricing: {
        currency: 'USD',
        baseRate: 150,
        minimumBooking: 30,
        cancellationPolicy: '24 hours notice required'
      },
      availability: {
        advanceBooking: 7, // days
        maxBookingDuration: 180, // minutes
        bufferTime: 15 // minutes between bookings
      },
      communication: {
        preferredMethods: ['video_call', 'phone', 'chat'],
        responseTime: '2 hours',
        autoConfirmation: true
      },
      settings: {
        allowInstantBooking: true,
        requireClientInfo: true,
        sendReminders: true,
        collectPaymentUpfront: true
      }
    };

    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching provider config:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
