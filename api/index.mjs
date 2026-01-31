// src/app.ts
import express from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'model User {\n  id            String    @id\n  name          String\n  email         String\n  emailVerified Boolean   @default(false)\n  image         String?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n\n  role   String? @default("USER")\n  phone  String?\n  status String? @default("ACTIVE")\n\n  // Relations\n  tutorProfile    TutorProfile?\n  studentBookings Booking[]     @relation("StudentBookings")\n  tutorBookings   Booking[]     @relation("TutorBookings")\n  reviewsGiven    Review[]      @relation("ReviewsGiven")\n\n  @@unique([email])\n  @@index([role])\n  @@index([status])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel AvailabilitySlot {\n  id             String   @id @default(cuid())\n  tutorProfileId String\n  startTime      DateTime\n  endTime        DateTime\n  isBooked       Boolean  @default(false)\n  createdAt      DateTime @default(now())\n\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  booking      Booking?\n\n  @@index([tutorProfileId, startTime])\n  @@index([isBooked])\n}\n\nmodel Booking {\n  id             String        @id @default(cuid())\n  studentId      String\n  tutorId        String // userId of tutor\n  tutorProfileId String\n  availabilityId String?       @unique\n  status         BookingStatus @default(CONFIRMED)\n\n  // Session details\n  startTime DateTime\n  endTime   DateTime\n  price     Int\n  currency  String   @default("BDT")\n  notes     String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  student      User         @relation("StudentBookings", fields: [studentId], references: [id], onDelete: Restrict)\n  tutor        User         @relation("TutorBookings", fields: [tutorId], references: [id], onDelete: Restrict)\n  tutorProfile TutorProfile @relation("TutorProfileBookings", fields: [tutorProfileId], references: [id], onDelete: Restrict)\n\n  availability AvailabilitySlot? @relation(fields: [availabilityId], references: [id], onDelete: SetNull)\n  review       Review?\n\n  @@index([studentId, createdAt])\n  @@index([tutorId, createdAt])\n  @@index([tutorProfileId, startTime])\n  @@index([status])\n}\n\nmodel Category {\n  id        String   @id @default(cuid())\n  name      String   @unique\n  slug      String   @unique\n  isActive  Boolean  @default(true)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  tutors TutorCategory[]\n\n  @@index([isActive])\n}\n\nmodel Post {\n  id         String     @id @default(uuid())\n  title      String     @db.VarChar(225)\n  content    String     @db.Text\n  thumbnail  String?\n  isFeatured Boolean    @default(false)\n  status     PostStatus @default(PUBLISHED)\n  tags       String[]\n  views      Int        @default(0)\n  authorId   String // better auth\n  createdAt  DateTime   @default(now())\n  updatedAt  DateTime   @updatedAt\n\n  @@index([authorId])\n  @@map("posts")\n}\n\nenum PostStatus {\n  DRAFT\n  PUBLISHED\n  ARCHIVED\n}\n\nmodel Review {\n  id             String @id @default(cuid())\n  bookingId      String @unique\n  tutorProfileId String\n  studentId      String\n\n  rating    Int // 1..5\n  comment   String?\n  createdAt DateTime @default(now())\n\n  // Relations\n  booking      Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  student      User         @relation("ReviewsGiven", fields: [studentId], references: [id], onDelete: Restrict)\n\n  @@index([tutorProfileId, createdAt])\n  @@index([rating])\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum Role {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  BANNED\n}\n\nenum BookingStatus {\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nmodel TutorProfile {\n  id            String   @id @default(cuid())\n  userId        String   @unique\n  bio           String?\n  headline      String?\n  hourlyRate    Int // store in cents? or integer currency units (BDT). Keep consistent in app.\n  currency      String   @default("BDT")\n  languages     String[] @default([])\n  experienceYrs Int      @default(0)\n  education     String?\n  timezone      String   @default("Asia/Dhaka")\n  isVerified    Boolean  @default(false)\n\n  avgRating   Float @default(0)\n  reviewCount Int   @default(0)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)\n  categories   TutorCategory[]\n  availability AvailabilitySlot[]\n  reviews      Review[]\n  bookings     Booking[]          @relation("TutorProfileBookings")\n\n  @@index([hourlyRate])\n  @@index([avgRating])\n}\n\nmodel TutorCategory {\n  tutorProfileId String\n  categoryId     String\n\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  category     Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@id([tutorProfileId, categoryId])\n  @@index([categoryId])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"studentBookings","kind":"object","type":"Booking","relationName":"StudentBookings"},{"name":"tutorBookings","kind":"object","type":"Booking","relationName":"TutorBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"ReviewsGiven"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"AvailabilitySlot":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"isBooked","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"AvailabilitySlotToTutorProfile"},{"name":"booking","kind":"object","type":"Booking","relationName":"AvailabilitySlotToBooking"}],"dbName":null},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"availabilityId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"price","kind":"scalar","type":"Int"},{"name":"currency","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"StudentBookings"},{"name":"tutor","kind":"object","type":"User","relationName":"TutorBookings"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileBookings"},{"name":"availability","kind":"object","type":"AvailabilitySlot","relationName":"AvailabilitySlotToBooking"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"}],"dbName":null},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutors","kind":"object","type":"TutorCategory","relationName":"CategoryToTutorCategory"}],"dbName":null},"Post":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"thumbnail","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"PostStatus"},{"name":"tags","kind":"scalar","type":"String"},{"name":"views","kind":"scalar","type":"Int"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"posts"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"},{"name":"student","kind":"object","type":"User","relationName":"ReviewsGiven"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"headline","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Int"},{"name":"currency","kind":"scalar","type":"String"},{"name":"languages","kind":"scalar","type":"String"},{"name":"experienceYrs","kind":"scalar","type":"Int"},{"name":"education","kind":"scalar","type":"String"},{"name":"timezone","kind":"scalar","type":"String"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"avgRating","kind":"scalar","type":"Float"},{"name":"reviewCount","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"categories","kind":"object","type":"TutorCategory","relationName":"TutorCategoryToTutorProfile"},{"name":"availability","kind":"object","type":"AvailabilitySlot","relationName":"AvailabilitySlotToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"TutorProfileBookings"}],"dbName":null},"TutorCategory":{"fields":[{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorCategoryToTutorProfile"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutorCategory"}],"dbName":null}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer } = await import("buffer");
  const wasmArray = Buffer.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  // Use true for port 465, false for port 587
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS
  }
});
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
    // or "mysql", "postgresql", ...etc
  }),
  trustedOrigins: [process.env.APP_URL],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false
      },
      phone: {
        type: "string",
        required: false
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
        const info = await transporter.sendMail({
          from: '"Prisma Blog" <prismablog@ph.com>',
          to: user.email,
          subject: "Please verify your email!",
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .header {
      background-color: #0f172a;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 22px;
    }

    .content {
      padding: 30px;
      color: #334155;
      line-height: 1.6;
    }

    .content h2 {
      margin-top: 0;
      font-size: 20px;
      color: #0f172a;
    }

    .button-wrapper {
      text-align: center;
      margin: 30px 0;
    }

    .verify-button {
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      font-weight: bold;
      border-radius: 6px;
      display: inline-block;
    }

    .verify-button:hover {
      background-color: #1d4ed8;
    }

    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }

    .link {
      word-break: break-all;
      font-size: 13px;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Prisma Blog</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>
        Hello ${user.name} <br /><br />
        Thank you for registering on <strong>Prisma Blog</strong>.
        Please confirm your email address to activate your account.
      </p>

      <div class="button-wrapper">
        <a href="${verificationUrl}" class="verify-button">
          Verify Email
        </a>
      </div>

      <p>
        If the button doesn\u2019t work, copy and paste the link below into your browser:
      </p>

      <p class="link">
        ${url}
      </p>

      <p>
        This verification link will expire soon for security reasons.
        If you did not create an account, you can safely ignore this email.
      </p>

      <p>
        Regards, <br />
        <strong>Prisma Blog Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      \xA9 2025 Prisma Blog. All rights reserved.
    </div>
  </div>
</body>
</html>
`
        });
        console.log("Message sent:", info.messageId);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  }
});

// src/modules/bookings/bookings.route.ts
import { Router } from "express";

// src/middlewares/auth.ts
var auth2 = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });
      console.log("Auth Middleware Session:", session);
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!"
        });
      }
      if (!session.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verfiy your email!"
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resources!"
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
var auth_default = auth2;

// src/modules/bookings/bookings.service.ts
var BookingsService = {
  create: async (studentId, dto) => {
    if (!dto?.tutorProfileId) throw new Error("tutorProfileId is required");
    if (!dto?.availabilityId) throw new Error("availabilityId is required");
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: dto.availabilityId },
      select: {
        id: true,
        tutorProfileId: true,
        startTime: true,
        endTime: true,
        isBooked: true,
        tutorProfile: { select: { userId: true, hourlyRate: true, currency: true } }
      }
    });
    if (!slot) throw new Error("Slot not found");
    if (slot.tutorProfileId !== dto.tutorProfileId) throw new Error("Slot does not match tutor profile");
    if (slot.isBooked) throw new Error("Slot already booked");
    return prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true }
      });
      const booking = await tx.booking.create({
        data: {
          studentId,
          tutorId: slot.tutorProfile.userId,
          tutorProfileId: slot.tutorProfileId,
          availabilityId: slot.id,
          status: "CONFIRMED",
          startTime: slot.startTime,
          // ✅ valid Date from DB
          endTime: slot.endTime,
          // ✅ valid Date from DB
          price: slot.tutorProfile.hourlyRate ?? 0,
          currency: slot.tutorProfile.currency ?? "BDT"
        },
        select: { id: true, status: true, startTime: true, endTime: true }
      });
      return booking;
    });
  },
  list: async (userId, role) => {
    const where = role === "admin" ? {} : role === "tutor" ? { tutorId: userId } : { studentId: userId };
    return prisma.booking.findMany({
      where,
      orderBy: { startTime: "desc" },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        price: true,
        currency: true,
        tutor: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } }
      }
    });
  },
  cancel: async (studentId, bookingId) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");
    if (booking.studentId !== studentId) throw new Error("Forbidden");
    if (booking.status !== "CONFIRMED") throw new Error("Only confirmed bookings can be cancelled");
    return prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  },
  complete: async (tutorId, bookingId) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");
    if (booking.tutorId !== tutorId) throw new Error("Forbidden");
    if (booking.status !== "CONFIRMED") throw new Error("Only confirmed bookings can be completed");
    return prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
  }
};

// src/modules/bookings/bookings.controller.ts
var BookingsController = {
  create: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const booking = await BookingsService.create(req.user.id, req.body);
      return res.status(201).json({ success: true, message: "Booking confirmed", data: booking });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message ?? "Failed to create booking" });
    }
  },
  listMineOrAll: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const items = await BookingsService.list(req.user.id, req.user.role);
      return res.json({ success: true, data: { items } });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message ?? "Failed to load bookings" });
    }
  },
  cancel: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const bookingId = req.params.id;
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "bookingId is required"
        });
      }
      const updated = await BookingsService.cancel(req.user.id, bookingId);
      return res.json({ success: true, message: "Booking cancelled", data: updated });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message ?? "Cancel failed" });
    }
  },
  complete: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const bookingId = req.params.id;
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "bookingId is required"
        });
      }
      const updated = await BookingsService.complete(req.user.id, bookingId);
      return res.json({ success: true, message: "Session marked completed", data: updated });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message ?? "Complete failed" });
    }
  }
};

// src/modules/bookings/bookings.route.ts
var router = Router();
router.use(auth_default("student" /* STUDENT */, "tutor" /* TUTOR */, "admin" /* ADMIN */));
router.post("/", auth_default("student" /* STUDENT */), BookingsController.create);
router.get("/", BookingsController.listMineOrAll);
router.patch("/:id/cancel", auth_default("student" /* STUDENT */), BookingsController.cancel);
router.patch("/:id/complete", auth_default("tutor" /* TUTOR */), BookingsController.complete);
var bookingRouter = router;

// src/modules/tutorProfile/profile.router.ts
import { Router as Router2 } from "express";

// src/modules/tutorProfile/profile.service.ts
var TutorProfileService = {
  create: async (userId, data) => {
    return prisma.tutorProfile.create({
      data: { ...data, userId }
    });
  },
  getMine: async (userId) => {
    return prisma.tutorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        bio: true,
        languages: true,
        hourlyRate: true,
        currency: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } }
      }
    });
  },
  update: async (userId, data) => {
    return prisma.tutorProfile.update({
      where: { userId },
      data
    });
  },
  remove: async (userId) => {
    return prisma.tutorProfile.delete({
      where: { userId }
    });
  }
};

// src/modules/tutorProfile/profile.controller.ts
var TutorProfileController = {
  create: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      const profile = await TutorProfileService.create(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error("Create TutorProfile Error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to create tutor profile"
      });
    }
  },
  getMine: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      const profile = await TutorProfileService.getMine(req.user.id);
      return res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error("Get TutorProfile Error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to fetch tutor profile"
      });
    }
  },
  update: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      console.log("Updating profile for user:", req.user, "with data:", req.body);
      const profile = await TutorProfileService.update(req.user.id, req.body);
      return res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error("Update TutorProfile Error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to update tutor profile"
      });
    }
  },
  remove: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
      console.log("Deleting profile for user:", req.user);
      await TutorProfileService.remove(req.user.id);
      return res.status(200).json({
        success: true,
        message: "Tutor profile deleted successfully"
      });
    } catch (error) {
      console.error("Delete TutorProfile Error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to delete tutor profile"
      });
    }
  }
};

// src/modules/tutorProfile/profile.router.ts
var router2 = Router2();
router2.use(auth_default("tutor" /* TUTOR */));
router2.post("/", TutorProfileController.create);
router2.get("/me", TutorProfileController.getMine);
router2.patch("/", TutorProfileController.update);
router2.delete("/", TutorProfileController.remove);
var profileRouter = router2;

// src/modules/tutor/tutor.route.ts
import { Router as Router3 } from "express";

// src/modules/tutor/tutor.service.ts
var TutorManageService = {
  updateProfile: async (userId, dto) => {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Tutor profile not found");
    if (dto.hourlyRate != null && dto.hourlyRate < 0) {
      throw new Error("hourlyRate must be >= 0");
    }
    const data = {};
    if (dto.headline !== void 0) data.headline = dto.headline;
    if (dto.bio !== void 0) data.bio = dto.bio;
    if (dto.hourlyRate !== void 0) data.hourlyRate = dto.hourlyRate;
    if (dto.currency !== void 0) data.currency = dto.currency;
    if (dto.languages !== void 0) data.languages = dto.languages;
    if (dto.experienceYrs !== void 0) data.experienceYrs = dto.experienceYrs;
    if (dto.education !== void 0) data.education = dto.education;
    if (dto.timezone !== void 0) data.timezone = dto.timezone;
    return prisma.tutorProfile.update({
      where: { id: profile.id },
      data,
      select: {
        id: true,
        headline: true,
        bio: true,
        hourlyRate: true,
        currency: true,
        languages: true,
        experienceYrs: true,
        education: true,
        timezone: true
      }
    });
  },
  getAvailability: async (userId) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) throw new Error("Tutor profile not found");
    return prisma.availabilitySlot.findMany({
      where: { tutorProfileId: profile.id },
      orderBy: { startTime: "asc" },
      select: { id: true, startTime: true, endTime: true, isBooked: true }
    });
  },
  setAvailability: async (userId, dto) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) throw new Error("Tutor profile not found");
    const now = /* @__PURE__ */ new Date();
    const slots = dto?.slots;
    if (!Array.isArray(slots) || slots.length === 0) throw new Error("slots is required");
    const parsed = slots.map((s) => ({
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime)
    }));
    for (const s of parsed) {
      if (isNaN(s.startTime.getTime()) || isNaN(s.endTime.getTime())) {
        throw new Error("Invalid date format in slots");
      }
      if (!(s.startTime < s.endTime)) throw new Error("Invalid slot time range");
      if (s.startTime < now) throw new Error("Slot startTime must be in the future");
    }
    parsed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 1; i < parsed.length; i++) {
      const prev = parsed[i - 1];
      const curr = parsed[i];
      if (!prev || !curr) continue;
      if (curr.startTime < prev.endTime) {
        throw new Error("Overlapping slots in request payload");
      }
    }
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.availabilitySlot.deleteMany({
        where: {
          tutorProfileId: profile.id,
          isBooked: false,
          startTime: { gte: now }
        }
      });
      await tx.availabilitySlot.createMany({
        data: parsed.map((s) => ({
          tutorProfileId: profile.id,
          startTime: s.startTime,
          endTime: s.endTime,
          isBooked: false
        }))
      });
      const items = await tx.availabilitySlot.findMany({
        where: { tutorProfileId: profile.id },
        orderBy: { startTime: "asc" },
        select: { id: true, startTime: true, endTime: true, isBooked: true }
      });
      return { ok: true, deletedCount: deleted.count, totalSlots: items.length, items };
    });
    return result;
  },
  setCategories: async (userId, dto) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) throw new Error("Tutor profile not found");
    const ids = dto.categoryIds;
    const found = await prisma.category.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true }
    });
    if (found.length !== ids.length) throw new Error("Some categories are invalid or inactive");
    await prisma.$transaction(async (tx) => {
      await tx.tutorCategory.deleteMany({
        where: { tutorProfileId: profile.id }
      });
      await tx.tutorCategory.createMany({
        data: ids.map((categoryId) => ({
          tutorProfileId: profile.id,
          categoryId
        }))
      });
    });
    const selected = await prisma.tutorCategory.findMany({
      where: { tutorProfileId: profile.id },
      select: { category: { select: { id: true, name: true, slug: true } } }
    });
    return { items: selected };
  }
};

// src/modules/tutor/tutor.controller.ts
var TutorManageController = {
  updateProfile: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const updated = await TutorManageService.updateProfile(req.user.id, req.body);
      return res.status(200).json({
        success: true,
        message: "Profile updated",
        data: updated
      });
    } catch (e) {
      console.error("updateProfile error:", e);
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed to update profile"
      });
    }
  },
  getAvailability: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const items = await TutorManageService.getAvailability(req.user.id);
      return res.status(200).json({
        success: true,
        data: { items }
      });
    } catch (e) {
      console.error("getAvailability error:", e);
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed to load availability"
      });
    }
  },
  setAvailability: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const slots = req.body?.slots;
      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "slots is required (array)"
        });
      }
      const result = await TutorManageService.setAvailability(req.user.id, { slots });
      return res.status(200).json({
        success: true,
        message: "Availability updated",
        data: result
      });
    } catch (e) {
      console.error("setAvailability error:", e);
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed to update availability"
      });
    }
  },
  setCategories: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const categoryIds = req.body?.categoryIds;
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ success: false, message: "categoryIds is required" });
      }
      const result = await TutorManageService.setCategories(req.user.id, { categoryIds });
      return res.json({ success: true, message: "Categories updated", data: result });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  }
};

// src/modules/tutor/tutor.route.ts
var router3 = Router3();
router3.use(auth_default("tutor" /* TUTOR */));
router3.put("/profile", TutorManageController.updateProfile);
router3.get("/availability", auth_default("tutor" /* TUTOR */), TutorManageController.getAvailability);
router3.put("/availability", auth_default("tutor" /* TUTOR */), TutorManageController.setAvailability);
router3.put("/categories", auth_default("tutor" /* TUTOR */), TutorManageController.setCategories);
var tutorRoutes = router3;

// src/modules/categories/categories.route.ts
import { Router as Router4 } from "express";

// src/modules/categories/categories.service.ts
var CategoriesService = {
  list: async () => {
    const items = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true }
    });
    return { items };
  }
};

// src/modules/categories/categories.controller.ts
var CategoriesController = {
  list: async (_req, res) => {
    const result = await CategoriesService.list();
    res.json(result);
    console.log(result);
  }
};

// src/modules/categories/categories.route.ts
var router4 = Router4();
router4.get("/", CategoriesController.list);
var categoriesRoutes = router4;

// src/modules/tutors/tutors.route.ts
import { Router as Router5 } from "express";

// src/modules/tutors/tutors.service.ts
var TutorsService = {
  list: async () => {
    return prisma.tutorProfile.findMany({
      select: {
        id: true,
        headline: true,
        hourlyRate: true,
        currency: true,
        avgRating: true,
        reviewCount: true,
        user: { select: { id: true, name: true, image: true } }
      },
      orderBy: { avgRating: "desc" }
    });
  },
  details: async (tutorProfileId) => {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      select: {
        id: true,
        headline: true,
        bio: true,
        hourlyRate: true,
        currency: true,
        avgRating: true,
        reviewCount: true,
        user: { select: { id: true, name: true, image: true } },
        availability: {
          where: { isBooked: false },
          select: { id: true, startTime: true, endTime: true },
          orderBy: { startTime: "asc" }
        }
      }
    });
    if (!tutor) throw new Error("Tutor not found");
    return tutor;
  }
};

// src/modules/tutors/tutors.controller.ts
var TutorsController = {
  list: async (req, res) => {
    try {
      const items = await TutorsService.list();
      return res.json({ success: true, data: { items } });
    } catch (e) {
      return res.status(500).json({ success: false, message: e?.message ?? "Failed to load tutors" });
    }
  },
  details: async (req, res) => {
    try {
      const tutor = await TutorsService.details(req.params.id);
      return res.json({ success: true, data: tutor });
    } catch (e) {
      return res.status(404).json({ success: false, message: e?.message ?? "Tutor not found" });
    }
  }
};

// src/modules/tutors/tutors.route.ts
var router5 = Router5();
router5.get("/", TutorsController.list);
router5.get("/:id", TutorsController.details);
var tutorsRoutes = router5;

// src/modules/reviews/reviews.route.ts
import { Router as Router6 } from "express";

// src/modules/reviews/reviews.service.ts
var ReviewsService = {
  create: async (studentId, dto) => {
    if (!dto?.bookingId) throw new Error("bookingId is required");
    if (!dto?.rating || dto.rating < 1 || dto.rating > 5) throw new Error("rating must be 1-5");
    const booking = await prisma.booking.findUnique({
      where: { id: dto.bookingId },
      select: { id: true, studentId: true, tutorProfileId: true, status: true }
    });
    if (!booking) throw new Error("Booking not found");
    if (booking.studentId !== studentId) throw new Error("Forbidden");
    if (booking.status !== "COMPLETED") throw new Error("Only COMPLETED bookings can be reviewed");
    const exists = await prisma.review.findFirst({
      where: { bookingId: booking.id },
      select: { id: true }
    });
    if (exists) throw new Error("Review already submitted");
    return prisma.review.create({
      data: {
        bookingId: booking.id,
        tutorProfileId: booking.tutorProfileId,
        studentId,
        rating: dto.rating,
        comment: dto.comment ?? null
      },
      select: { id: true }
    });
  }
};

// src/modules/reviews/reviews.controller.ts
var ReviewsController = {
  create: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const created = await ReviewsService.create(req.user.id, req.body);
      return res.status(201).json({ success: true, message: "Review created", data: created });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Review failed" });
    }
  }
};

// src/modules/reviews/reviews.route.ts
var router6 = Router6();
router6.post("/", auth_default("student" /* STUDENT */), ReviewsController.create);
var reviewRoutes = router6;

// src/modules/admin/admin.route.ts
import { Router as Router7 } from "express";

// src/modules/admin/admin.service.ts
var ALLOWED_STATUS = /* @__PURE__ */ new Set(["ACTIVE", "BANNED"]);
var AdminService = {
  stats: async () => {
    const [
      totalUsers,
      totalStudents,
      totalTutors,
      totalAdmins,
      activeUsers,
      bannedUsers,
      totalBookings,
      activeCategories,
      totalCategories
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "student" } }),
      prisma.user.count({ where: { role: "tutor" } }),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "BANNED" } }),
      prisma.booking.count(),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count()
    ]);
    const bookingByStatus = await prisma.booking.groupBy({
      by: ["status"],
      _count: { status: true }
    });
    return {
      totalUsers,
      totalStudents,
      totalTutors,
      totalAdmins,
      activeUsers,
      bannedUsers,
      totalBookings,
      totalCategories,
      activeCategories,
      bookingByStatus
    };
  },
  listUsers: async () => {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true
      }
    });
  },
  updateUserStatus: async (userId, status) => {
    const next = status.toUpperCase();
    if (!ALLOWED_STATUS.has(next)) throw new Error("Invalid status. Use ACTIVE or BANNED");
    return prisma.user.update({
      where: { id: userId },
      data: { status: next },
      select: { id: true, status: true }
    });
  },
  listBookings: async () => {
    return prisma.booking.findMany({
      orderBy: { startTime: "desc" },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        price: true,
        currency: true,
        student: { select: { id: true, name: true, email: true } },
        tutor: { select: { id: true, name: true, email: true } },
        tutorProfileId: true
      }
    });
  },
  listCategories: async () => {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, isActive: true }
    });
  },
  createCategory: async (dto) => {
    if (!dto?.name?.trim()) throw new Error("name is required");
    const slug = (dto.slug?.trim() || dto.name.trim().toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    return prisma.category.create({
      data: { name: dto.name.trim(), slug, isActive: dto.isActive ?? true },
      select: { id: true, name: true, slug: true, isActive: true }
    });
  },
  updateCategory: async (id, dto) => {
    const data = {};
    if (dto.name !== void 0) data.name = dto.name.trim();
    if (dto.slug !== void 0) data.slug = dto.slug.trim();
    if (dto.isActive !== void 0) data.isActive = dto.isActive;
    return prisma.category.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, isActive: true }
    });
  },
  deleteCategory: async (id) => {
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  }
};

// src/modules/admin/admin.controller.ts
var AdminController = {
  stats: async (req, res) => {
    try {
      const data = await AdminService.stats();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  listUsers: async (req, res) => {
    try {
      const items = await AdminService.listUsers();
      return res.json({ success: true, data: { items } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  updateUserStatus: async (req, res) => {
    try {
      const userId = req.params.id;
      const status = req.body?.status;
      if (!status) {
        return res.status(400).json({ success: false, message: "status is required" });
      }
      const updated = await AdminService.updateUserStatus(userId, status);
      return res.json({ success: true, message: "User status updated", data: updated });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  listBookings: async (req, res) => {
    try {
      const items = await AdminService.listBookings();
      return res.json({ success: true, data: { items } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  listCategories: async (req, res) => {
    try {
      const items = await AdminService.listCategories();
      return res.json({ success: true, data: { items } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  createCategory: async (req, res) => {
    try {
      const created = await AdminService.createCategory(req.body);
      return res.status(201).json({ success: true, message: "Category created", data: created });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  updateCategory: async (req, res) => {
    try {
      const updated = await AdminService.updateCategory(req.params.id, req.body);
      return res.json({ success: true, message: "Category updated", data: updated });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  deleteCategory: async (req, res) => {
    try {
      await AdminService.deleteCategory(req.params.id);
      return res.json({ success: true, message: "Category deleted" });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  }
};

// src/modules/admin/admin.route.ts
var router7 = Router7();
router7.get("/stats", auth_default("admin" /* ADMIN */), AdminController.stats);
router7.get("/users", auth_default("admin" /* ADMIN */), AdminController.listUsers);
router7.patch("/users/:id/status", auth_default("admin" /* ADMIN */), AdminController.updateUserStatus);
router7.get("/bookings", auth_default("admin" /* ADMIN */), AdminController.listBookings);
router7.get("/categories", auth_default("admin" /* ADMIN */), AdminController.listCategories);
router7.post("/categories", auth_default("admin" /* ADMIN */), AdminController.createCategory);
router7.patch("/categories/:id", auth_default("admin" /* ADMIN */), AdminController.updateCategory);
router7.delete("/categories/:id", auth_default("admin" /* ADMIN */), AdminController.deleteCategory);
var adminRouter = router7;

// src/app.ts
var app = express();
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:3000",
  // client side url
  credentials: true
}));
app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/bookings", bookingRouter);
app.use("/api/tutor-profile", profileRouter);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/tutors", tutorsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRouter);
app.get("/", (req, res) => {
  res.send("Skill Bridge!");
});
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
