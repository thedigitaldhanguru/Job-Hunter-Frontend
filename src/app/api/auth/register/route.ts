import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('SET search_path TO dbc, public');

      // Check if user already exists
      const existingUserRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingUserRes.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user
      const insertRes = await client.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name || '', email, hashedPassword]
      );

      return NextResponse.json({ user: insertRes.rows[0] }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
