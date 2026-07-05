import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Pool } from '@neondatabase/serverless';
import { Resend } from 'resend';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('SET search_path TO dbc, public');

      // Check if user exists
      const userRes = await client.query('SELECT id, email FROM users WHERE email = $1', [email]);
      if (userRes.rows.length === 0) {
        // Return 200 even if user doesn't exist to prevent email enumeration
        return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' }, { status: 200 });
      }

      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Insert token into database
      await client.query(
        'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
        [email, resetToken, expiresAt]
      );

      // Construct reset URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Send actual email if API key exists
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Hiredeck <onboarding@resend.dev>',
          to: email,
          subject: 'Reset your password for Hiredeck',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #0f172a;">
              <h2 style="color: #0f172a;">Password Reset Request</h2>
              <p>Someone recently requested a password change for your Hiredeck account. If this was you, you can set a new password here:</p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0;">Reset Password</a>
              <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">The Hiredeck Team</p>
            </div>
          `
        });
      } else {
        // Fallback for local development if no key is provided
        console.log('=============================================');
        console.log('🔒 PASSWORD RESET LINK GENERATED');
        console.log('Click here to reset:', resetUrl);
        console.log('=============================================');
      }

      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
