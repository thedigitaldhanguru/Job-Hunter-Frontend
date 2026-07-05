const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

// Read .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!databaseUrl) throw new Error("DATABASE_URL not found in .env");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO dbc, public');
    console.log("Connected to Neon db...");

    console.log("Adding password column to users...");
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);

    console.log("Creating password_reset_tokens table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used BOOLEAN DEFAULT false
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
    `);

    console.log("Database schema updated successfully!");
  } catch (err) {
    console.error("Database schema update failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
