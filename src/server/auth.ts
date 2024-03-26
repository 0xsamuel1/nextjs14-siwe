// Imports
// ========================================================
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { prisma } from "./db";
// SIWE Integration
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { getCsrfToken } from "next-auth/react";
import { cookies } from "next/headers";

interface SessionI extends DefaultSession {
  user: {
    id: string;
    // ...other properties
    // role: UserRole;
  } & DefaultSession["user"];
}

// Auth Options
// ========================================================
/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    // token.sub will refer to the id of the wallet address
    session: ({ session, token }) =>
      ({
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      }) as SessionI & { user: { id: string } },
  },
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      type: "credentials",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      authorize: async (credentials) => {
        try {
          const siwe = new SiweMessage(
            JSON.parse(credentials!.message ?? "{}") as Partial<SiweMessage>,
          );
          const nonce = await getCsrfToken();
          const csrf = cookies()
            .get("next-auth.csrf-token")
            ?.value.split("|")[0];

          const fields = await siwe.verify({
            signature: credentials?.signature ?? "",
          });

          console.log(`csrf`, csrf);
          console.log(`nonce`, nonce);
          console.log(`fields.data.nonce`, fields.data.nonce);

          if (fields.data.nonce !== csrf) {
            return null;
          }

          // Check if user exists
          let user = await prisma.user.findUnique({
            where: {
              address: fields.data.address,
            },
          });
          // Create new user if doesn't exist
          if (!user) {
            user = await prisma.user.create({
              data: {
                address: fields.data.address,
              },
            });

            await prisma.account.create({
              data: {
                userId: user.id,
                type: "credentials",
                provider: "Ethereum",
                providerAccountId: fields.data.address,
              },
            });
          }

          return {
            // Pass user id instead of address
            // id: fields.address
            id: user.id,
          };
        } catch (error) {
          // Uncomment or add logging if needed
          console.log(`error in authOptions`);
          console.error({ error });
          return null;
        }
      },
    }),
  ],
};

// Auth Session
// ========================================================
/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = async () => {
  // Changed from authOptions to authOption(ctx)
  // This allows use to retrieve the csrf token to verify as the nonce
  return getServerSession(authOptions);
};
