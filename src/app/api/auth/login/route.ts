import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@netlify/neon';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const sql = neon(); // Uses NETLIFY_DATABASE_URL automatically

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
    const [user] = await sql`
      SELECT id, email, password_hash, user_type, is_admin, created_at
      FROM users 
      WHERE email = ${email}
    `;

    if (!user) {
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
        user_type: user.user_type,
        isAdmin: user.is_admin || false
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
          user_type: user.user_type,
          isAdmin: user.is_admin || false,
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
