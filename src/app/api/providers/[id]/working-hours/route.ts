import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Sample working hours data
    const workingHours = {
      providerId: id,
      timezone: 'UTC+8',
      schedule: {
        monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        saturday: { isAvailable: false, startTime: null, endTime: null },
        sunday: { isAvailable: false, startTime: null, endTime: null }
      },
      breakTimes: [
        { startTime: '12:00', endTime: '13:00', description: 'Lunch Break' }
      ],
      exceptions: [
        {
          date: '2024-12-25',
          isAvailable: false,
          description: 'Christmas Day'
        }
      ]
    };

    return NextResponse.json(workingHours);

  } catch (error) {
    console.error('Error fetching working hours:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
