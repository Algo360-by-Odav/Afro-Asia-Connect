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
    const validRoles = ['member', 'seller', 'supplier', 'service_provider', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role in database
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role, user_type: role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Role updated successfully',
      user: data 
    });

  } catch (error) {
    console.error('Error in update-role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
