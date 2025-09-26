import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Add detailed logging for debugging
    console.log('Fix user role endpoint called');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token received, length:', token.length);
    
    // Check if NEXTAUTH_SECRET exists
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET environment variable not found');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    const userId = decoded.userId;
    console.log('User ID from token:', userId);

    const { newRole } = await request.json();

    // Validate role
    const validRoles = ['buyer', 'seller', 'service_provider'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log('Fixing user role for userId:', userId, 'to role:', newRole);
    
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    
    console.log('Supabase admin client available, attempting update');
    
    // Update user role in database
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        role: newRole,
        user_type: newRole,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating user role:', error);
      return NextResponse.json({ 
        error: 'Failed to update role', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('Successfully updated user role:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'Role updated successfully',
      user: {
        id: (data as any)?.id,
        email: (data as any)?.email,
        full_name: (data as any)?.full_name,
        role: (data as any)?.role,
        user_type: (data as any)?.user_type || (data as any)?.role
      }
    });

  } catch (error) {
    console.error('Error in fix-user-role:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error:', error.message);
      return NextResponse.json({ error: 'Invalid token', details: error.message }, { status: 401 });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expired:', error.message);
      return NextResponse.json({ error: 'Token expired', details: error.message }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
