const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!databaseUrl) throw new Error("DATABASE_URL not found in .env");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO dbc, public');
    console.log("Connected to Neon db...");

    // Determine the type of the users.id column to match it
    const typeRes = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);
    const idType = typeRes.rows[0]?.data_type || 'uuid';
    console.log("Users ID type is:", idType);

    // 1. Create the new table
    console.log("Creating user_credentials table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        user_id ${idType} PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password VARCHAR(255) NOT NULL
      );
    `);

    // 2. Migrate existing passwords (if any exist)
    console.log("Migrating existing passwords...");
    await client.query(`
      INSERT INTO user_credentials (user_id, password)
      SELECT id, password FROM users 
      WHERE password IS NOT NULL
      ON CONFLICT (user_id) DO NOTHING;
    `);

    // 3. Drop the password column from users
    console.log("Dropping password column from users table...");
    await client.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS password;
    `);

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
