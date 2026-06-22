import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // verify this path
import jwt from "jsonwebtoken";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    // Fetch the user's tier from the database
    const client = await pool.connect();
    let tier = "free";
    try {
      // Set search_path just like in auth.ts
      await client.query("SET search_path TO dbc, public");
      const result = await client.query(
        "SELECT tier FROM users WHERE email = $1",
        [email]
      );
      if (result.rows.length > 0 && result.rows[0].tier) {
        tier = result.rows[0].tier;
      }
    } catch (dbError) {
      console.error("Database error fetching tier:", dbError);
      // fallback to free
    } finally {
      client.release();
    }

    // Issue the custom JWT for the Python backend
    const secret = process.env.JWT_SECRET || "super-secret-key-change-in-prod";
    const expiresIn = "7d"; // 7 days

    const token = jwt.sign(
      {
        sub: email,
        email: email,
        tier: tier,
      },
      secret,
      { expiresIn }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating extension token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
