import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@netlify/neon';
import bcrypt from 'bcrypt';

const sql = neon(); // Uses NETLIFY_DATABASE_URL automatically

export async function POST(request: NextRequest) {
  try {
    const { email, password, user_type } = await request.json();

    // Validate required fields
    if (!email || !password || !user_type) {
      return NextResponse.json(
        { success: false, msg: 'Email, password, and user_type are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, msg: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, msg: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate user_type
    const validUserTypes = ['buyer', 'seller', 'service_provider'];
    if (!validUserTypes.includes(user_type)) {
      return NextResponse.json(
        { success: false, msg: 'Invalid user_type. Must be buyer, seller, or service_provider' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, msg: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [newUser] = await sql`
      INSERT INTO users (email, password_hash, user_type, created_at, updated_at)
      VALUES (${email}, ${password_hash}, ${user_type}, NOW(), NOW())
      RETURNING id, email, user_type, created_at
    `;

    return NextResponse.json({
      success: true,
      msg: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          user_type: newUser.user_type,
          created_at: newUser.created_at
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, msg: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, msg: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
