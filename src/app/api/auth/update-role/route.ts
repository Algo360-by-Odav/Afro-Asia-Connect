import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    const userId = decoded.userId;

    const { role } = await request.json();

    // Validate role
    const validRoles = ['buyer', 'seller', 'service_provider', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log('Attempting to update user role for userId:', userId, 'to role:', role);
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    
    // Update user role in database
    // @ts-ignore - Temporary fix for Supabase type issues
    const { data, error } = await supabaseAdmin
      .from('users')
      // @ts-ignore
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating user role:', error);
      return NextResponse.json({ 
        error: 'Failed to update role', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('Successfully updated user role:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Role updated successfully',
      user: data 
    });

  } catch (error) {
    console.error('Error in update-role:', error);
    
    // Check if it's a JWT error
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
