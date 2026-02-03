import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: [process.env.APP_URL!],

  // session: {
  //   cookieCache: {
  //   enabled: true,
  //   maxAge: 5 * 60, // 5 minutes
  //   },
  //   },
    advanced: {
      cookiePrefix: "better-auth",
      useSecureCookies: process.env.NODE_ENV === "production",

      crossSubDomainCookies: {
      enabled: false,
      },
      disableCSRFCheck: true, // Allow requests without Origin header (Postman, mobile apps,etc.
      },

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false,
      },
    },
  },
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,               // important so newSession exists
    requireEmailVerification: false,
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // only after email signup
      if (ctx.path !== "/sign-up/email") return;

      const newSession = ctx.context.newSession; // exists in after hook :contentReference[oaicite:2]{index=2}
      const userId = newSession?.user?.id;

      if (!userId) return;

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });
    }),
  },
});
