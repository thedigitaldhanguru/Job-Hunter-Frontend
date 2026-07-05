import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('SET search_path TO dbc, public');

      // Verify token
      const tokenRes = await client.query(
        'SELECT email, expires_at FROM password_reset_tokens WHERE token = $1 AND used = false',
        [token]
      );

      if (tokenRes.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or already used reset token' }, { status: 400 });
      }

      const { email, expires_at } = tokenRes.rows[0];

      // Check expiration
      if (new Date() > new Date(expires_at)) {
        return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Get user id
      const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userRes.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
      }
      const userId = userRes.rows[0].id;

      // Upsert user credentials
      await client.query(
        `INSERT INTO user_credentials (user_id, password) 
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password`,
        [userId, hashedPassword]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used = true WHERE token = $1',
        [token]
      );

      return NextResponse.json({ message: 'Password has been successfully reset' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
