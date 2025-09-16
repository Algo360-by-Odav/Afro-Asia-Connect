import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, msg: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, full_name, phone_number, role, created_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, msg: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, msg: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        isAdmin: user.role === 'admin'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Return user data and token
    return NextResponse.json({
      success: true,
      msg: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role,
          isAdmin: user.role === 'admin',
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
