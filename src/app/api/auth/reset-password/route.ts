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

      // Update user password
      await client.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
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
