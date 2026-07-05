import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import NeonAdapter from "@auth/neon-adapter";
import { Pool, PoolClient } from "@neondatabase/serverless";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";

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
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const client = await pool.connect();
        try {
          await client.query('SET search_path TO dbc, public');
          const res = await client.query('SELECT * FROM users WHERE email = $1', [credentials.email]);
          const user = res.rows[0];

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        } finally {
          client.release();
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login", 
  },
};