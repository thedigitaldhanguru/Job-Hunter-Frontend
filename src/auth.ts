import Google from "next-auth/providers/google";
import NeonAdapter from "@auth/neon-adapter";
import { Pool, PoolClient } from "@neondatabase/serverless";
import { NextAuthOptions } from "next-auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('connect', (client: PoolClient) => {
  client.query('SET search_path TO dbc, public');
});

export const authOptions: NextAuthOptions = {
  adapter: NeonAdapter(pool),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/", // Redirect to home instead of /login
  },
};