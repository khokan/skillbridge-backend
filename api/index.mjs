var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [
    "postgresqlExtensions"
  ],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'model User {\n  id            String    @id\n  name          String\n  email         String\n  emailVerified Boolean   @default(true)\n  image         String?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n\n  role   String? @default("USER")\n  phone  String?\n  status String? @default("ACTIVE")\n\n  // Relations\n  tutorProfile    TutorProfile?\n  studentBookings Booking[]     @relation("StudentBookings")\n  tutorBookings   Booking[]     @relation("TutorBookings")\n  reviewsGiven    Review[]      @relation("ReviewsGiven")\n\n  @@unique([email])\n  @@index([role])\n  @@index([status])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel AvailabilitySlot {\n  id             String   @id @default(cuid())\n  tutorProfileId String\n  startTime      DateTime\n  endTime        DateTime\n  isBooked       Boolean  @default(false)\n  createdAt      DateTime @default(now())\n\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  booking      Booking?\n\n  @@index([tutorProfileId, startTime])\n  @@index([isBooked])\n}\n\nmodel Booking {\n  id             String        @id @default(cuid())\n  studentId      String\n  tutorId        String // userId of tutor\n  tutorProfileId String\n  availabilityId String?       @unique\n  status         BookingStatus @default(CONFIRMED)\n\n  // Session details\n  startTime DateTime\n  endTime   DateTime\n  price     Int\n  currency  String   @default("BDT")\n  notes     String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  student      User         @relation("StudentBookings", fields: [studentId], references: [id], onDelete: Restrict)\n  tutor        User         @relation("TutorBookings", fields: [tutorId], references: [id], onDelete: Restrict)\n  tutorProfile TutorProfile @relation("TutorProfileBookings", fields: [tutorProfileId], references: [id], onDelete: Restrict)\n\n  availability AvailabilitySlot? @relation(fields: [availabilityId], references: [id], onDelete: SetNull)\n  review       Review?\n\n  @@index([studentId, createdAt])\n  @@index([tutorId, createdAt])\n  @@index([tutorProfileId, startTime])\n  @@index([status])\n}\n\nmodel Category {\n  id        String   @id @default(cuid())\n  name      String   @unique\n  slug      String   @unique\n  isActive  Boolean  @default(true)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  tutors TutorCategory[]\n\n  @@index([isActive])\n}\n\nmodel Post {\n  id         String     @id @default(uuid())\n  title      String     @db.VarChar(225)\n  content    String     @db.Text\n  thumbnail  String?\n  isFeatured Boolean    @default(false)\n  status     PostStatus @default(PUBLISHED)\n  tags       String[]\n  views      Int        @default(0)\n  authorId   String // better auth\n  createdAt  DateTime   @default(now())\n  updatedAt  DateTime   @updatedAt\n\n  @@index([authorId])\n  @@map("posts")\n}\n\nenum PostStatus {\n  DRAFT\n  PUBLISHED\n  ARCHIVED\n}\n\nmodel DocumentEmbedding {\n  id String @id @default(uuid(7))\n\n  chunkKey    String  @unique\n  sourceType  String\n  sourceId    String\n  sourceLabel String?\n  content     String\n  metadata    Json?\n\n  embedding Unsupported("vector(2048)")\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  @@index([sourceType], name: "idx_document_embeddings_sourceType")\n  @@index([sourceId], name: "idx_document_embeddings_sourceId")\n  @@map("document_embeddings")\n}\n\nmodel Review {\n  id             String @id @default(cuid())\n  bookingId      String @unique\n  tutorProfileId String\n  studentId      String\n\n  rating    Int // 1..5\n  comment   String?\n  createdAt DateTime @default(now())\n\n  // Relations\n  booking      Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  student      User         @relation("ReviewsGiven", fields: [studentId], references: [id], onDelete: Restrict)\n\n  @@index([tutorProfileId, createdAt])\n  @@index([rating])\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider        = "prisma-client"\n  output          = "../../generated/prisma"\n  previewFeatures = ["postgresqlExtensions"]\n}\n\ndatasource db {\n  provider   = "postgresql"\n  extensions = [vector]\n}\n\nenum Role {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  BANNED\n}\n\nenum BookingStatus {\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nmodel TutorProfile {\n  id            String   @id @default(cuid())\n  userId        String   @unique\n  bio           String?\n  headline      String?\n  hourlyRate    Int // store in cents? or integer currency units (BDT). Keep consistent in app.\n  currency      String   @default("BDT")\n  languages     String[] @default([])\n  experienceYrs Int      @default(0)\n  education     String?\n  timezone      String   @default("Asia/Dhaka")\n  isVerified    Boolean  @default(false)\n\n  avgRating   Float @default(0)\n  reviewCount Int   @default(0)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)\n  categories   TutorCategory[]\n  availability AvailabilitySlot[]\n  reviews      Review[]\n  bookings     Booking[]          @relation("TutorProfileBookings")\n\n  @@index([hourlyRate])\n  @@index([avgRating])\n}\n\nmodel TutorCategory {\n  tutorProfileId String\n  categoryId     String\n\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  category     Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  @@id([tutorProfileId, categoryId])\n  @@index([categoryId])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"studentBookings","kind":"object","type":"Booking","relationName":"StudentBookings"},{"name":"tutorBookings","kind":"object","type":"Booking","relationName":"TutorBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"ReviewsGiven"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"AvailabilitySlot":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"isBooked","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"AvailabilitySlotToTutorProfile"},{"name":"booking","kind":"object","type":"Booking","relationName":"AvailabilitySlotToBooking"}],"dbName":null},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"availabilityId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"price","kind":"scalar","type":"Int"},{"name":"currency","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"student","kind":"object","type":"User","relationName":"StudentBookings"},{"name":"tutor","kind":"object","type":"User","relationName":"TutorBookings"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileBookings"},{"name":"availability","kind":"object","type":"AvailabilitySlot","relationName":"AvailabilitySlotToBooking"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"}],"dbName":null},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutors","kind":"object","type":"TutorCategory","relationName":"CategoryToTutorCategory"}],"dbName":null},"Post":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"thumbnail","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"PostStatus"},{"name":"tags","kind":"scalar","type":"String"},{"name":"views","kind":"scalar","type":"Int"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"posts"},"DocumentEmbedding":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"chunkKey","kind":"scalar","type":"String"},{"name":"sourceType","kind":"scalar","type":"String"},{"name":"sourceId","kind":"scalar","type":"String"},{"name":"sourceLabel","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"document_embeddings"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"},{"name":"student","kind":"object","type":"User","relationName":"ReviewsGiven"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"headline","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Int"},{"name":"currency","kind":"scalar","type":"String"},{"name":"languages","kind":"scalar","type":"String"},{"name":"experienceYrs","kind":"scalar","type":"Int"},{"name":"education","kind":"scalar","type":"String"},{"name":"timezone","kind":"scalar","type":"String"},{"name":"isVerified","kind":"scalar","type":"Boolean"},{"name":"avgRating","kind":"scalar","type":"Float"},{"name":"reviewCount","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"categories","kind":"object","type":"TutorCategory","relationName":"TutorCategoryToTutorProfile"},{"name":"availability","kind":"object","type":"AvailabilitySlot","relationName":"AvailabilitySlotToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"TutorProfileBookings"}],"dbName":null},"TutorCategory":{"fields":[{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorCategoryToTutorProfile"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutorCategory"}],"dbName":null}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
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
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  AvailabilitySlotScalarFieldEnum: () => AvailabilitySlotScalarFieldEnum,
  BookingScalarFieldEnum: () => BookingScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  DocumentEmbeddingScalarFieldEnum: () => DocumentEmbeddingScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PostScalarFieldEnum: () => PostScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  TutorCategoryScalarFieldEnum: () => TutorCategoryScalarFieldEnum,
  TutorProfileScalarFieldEnum: () => TutorProfileScalarFieldEnum,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.3.0",
  engine: "9d6ad21cbbceab97458517b147a6a09ff43aa735"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  AvailabilitySlot: "AvailabilitySlot",
  Booking: "Booking",
  Category: "Category",
  Post: "Post",
  DocumentEmbedding: "DocumentEmbedding",
  Review: "Review",
  TutorProfile: "TutorProfile",
  TutorCategory: "TutorCategory"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  role: "role",
  phone: "phone",
  status: "status"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AvailabilitySlotScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  startTime: "startTime",
  endTime: "endTime",
  isBooked: "isBooked",
  createdAt: "createdAt"
};
var BookingScalarFieldEnum = {
  id: "id",
  studentId: "studentId",
  tutorId: "tutorId",
  tutorProfileId: "tutorProfileId",
  availabilityId: "availabilityId",
  status: "status",
  startTime: "startTime",
  endTime: "endTime",
  price: "price",
  currency: "currency",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  isActive: "isActive",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PostScalarFieldEnum = {
  id: "id",
  title: "title",
  content: "content",
  thumbnail: "thumbnail",
  isFeatured: "isFeatured",
  status: "status",
  tags: "tags",
  views: "views",
  authorId: "authorId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var DocumentEmbeddingScalarFieldEnum = {
  id: "id",
  chunkKey: "chunkKey",
  sourceType: "sourceType",
  sourceId: "sourceId",
  sourceLabel: "sourceLabel",
  content: "content",
  metadata: "metadata",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  bookingId: "bookingId",
  tutorProfileId: "tutorProfileId",
  studentId: "studentId",
  rating: "rating",
  comment: "comment",
  createdAt: "createdAt"
};
var TutorProfileScalarFieldEnum = {
  id: "id",
  userId: "userId",
  bio: "bio",
  headline: "headline",
  hourlyRate: "hourlyRate",
  currency: "currency",
  languages: "languages",
  experienceYrs: "experienceYrs",
  education: "education",
  timezone: "timezone",
  isVerified: "isVerified",
  avgRating: "avgRating",
  reviewCount: "reviewCount",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorCategoryScalarFieldEnum = {
  tutorProfileId: "tutorProfileId",
  categoryId: "categoryId"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
var auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: [process.env.APP_URL],
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
      enabled: false
    },
    disableCSRFCheck: true
    // Allow requests without Origin header (Postman, mobile apps,etc.
  },
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
    autoSignIn: true,
    // important so newSession exists
    requireEmailVerification: false
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const newSession = ctx.context.newSession;
      const userId = newSession?.user?.id;
      if (!userId) return;
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true }
      });
    })
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
    const where = role === "ADMIN" ? {} : role === "TUTOR" ? { tutorId: userId } : { studentId: userId };
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
router.use(auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */));
router.post("/", auth_default("STUDENT" /* STUDENT */), BookingsController.create);
router.get("/", auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */), BookingsController.listMineOrAll);
router.patch("/:id/cancel", auth_default("STUDENT" /* STUDENT */), BookingsController.cancel);
router.patch("/:id/complete", auth_default("TUTOR" /* TUTOR */), BookingsController.complete);
var bookingRouter = router;

// src/modules/tutorProfile/profile.router.ts
import { Router as Router2 } from "express";

// src/modules/rag/embedding.service.ts
var EmbeddingService = class {
  apiKey = process.env.RAG_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "";
  apiUrl = "https://openrouter.ai/api/v1";
  embeddingModel = process.env.RAG_OPENROUTER_EMBEDDING_MODEL ?? process.env.OPENROUTER_EMBEDDING_MODEL ?? "nvidia/llama-nemotron-embed-vl-1b-v2:free";
  async generateEmbedding(text) {
    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is missing. Set RAG_OPENROUTER_API_KEY or OPENROUTER_API_KEY."
      );
    }
    const response = await fetch(`${this.apiUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: text,
        model: this.embeddingModel
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message;
      throw new Error(
        `OpenRouter embedding API error: ${response.status}${errorMessage ? ` - ${errorMessage}` : ""}`
      );
    }
    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      throw new Error("No embedding vector returned from OpenRouter");
    }
    return embedding;
  }
};

// src/modules/rag/indexing.service.ts
var SOURCE_TYPE = "TUTOR_PROFILE";
var toVectorLiteral = (vector) => `[${vector.join(",")}]`;
var IndexingService = class {
  embeddingService;
  constructor() {
    this.embeddingService = new EmbeddingService();
  }
  buildTutorProfileContent(profile) {
    const categories = profile.categories.map((entry) => entry.category.name).filter(Boolean);
    const reviews = profile.reviews.length > 0 ? profile.reviews.map((review) => {
      const comment = review.comment?.trim() || "No comment";
      return `- Rating: ${review.rating}/5. Comment: ${comment}`;
    }).join("\n") : "No reviews yet.";
    return `Tutor Name: ${profile.user.name}
Headline: ${profile.headline || "N/A"}
Bio: ${profile.bio || "N/A"}
Hourly Rate: ${profile.hourlyRate} ${profile.currency}
Experience: ${profile.experienceYrs} years
Education: ${profile.education || "N/A"}
Timezone: ${profile.timezone}
Languages: ${profile.languages.length > 0 ? profile.languages.join(", ") : "N/A"}
Verified: ${profile.isVerified ? "Yes" : "No"}
Average Rating: ${profile.avgRating}/5 from ${profile.reviewCount} reviews
Categories: ${categories.length > 0 ? categories.join(", ") : "None listed"}

Recent Reviews:
${reviews}`;
  }
  buildTutorProfileMetadata(profile) {
    return {
      tutorProfileId: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      headline: profile.headline,
      hourlyRate: profile.hourlyRate,
      currency: profile.currency,
      languages: profile.languages,
      experienceYrs: profile.experienceYrs,
      education: profile.education,
      timezone: profile.timezone,
      isVerified: profile.isVerified,
      avgRating: profile.avgRating,
      reviewCount: profile.reviewCount,
      categories: profile.categories.map((entry) => ({
        id: entry.category.id,
        name: entry.category.name,
        slug: entry.category.slug
      }))
    };
  }
  async fetchTutorProfileById(profileId) {
    return prisma.tutorProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        reviews: {
          orderBy: {
            createdAt: "desc"
          },
          take: 5,
          select: {
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      }
    });
  }
  async upsertDocument(chunkKey, sourceId, sourceLabel, content, metadata) {
    const embedding = await this.embeddingService.generateEmbedding(content);
    const vectorLiteral = toVectorLiteral(embedding);
    await prisma.$executeRaw(prismaNamespace_exports.sql`
      INSERT INTO "document_embeddings"
      (
        "chunkKey",
        "sourceType",
        "sourceId",
        "sourceLabel",
        "content",
        "metadata",
        "embedding",
        "isDeleted",
        "deletedAt",
        "updatedAt"
      )
      VALUES
      (
        ${chunkKey},
        ${SOURCE_TYPE},
        ${sourceId},
        ${sourceLabel},
        ${content},
        ${JSON.stringify(metadata)}::jsonb,
        CAST(${vectorLiteral} AS vector),
        false,
        null,
        NOW()
      )
      ON CONFLICT ("chunkKey")
      DO UPDATE SET
        "sourceType" = EXCLUDED."sourceType",
        "sourceId" = EXCLUDED."sourceId",
        "sourceLabel" = EXCLUDED."sourceLabel",
        "content" = EXCLUDED."content",
        "metadata" = EXCLUDED."metadata",
        "embedding" = EXCLUDED."embedding",
        "isDeleted" = false,
        "deletedAt" = null,
        "updatedAt" = NOW()
    `);
  }
  async indexTutorProfileById(profileId) {
    const profile = await this.fetchTutorProfileById(profileId);
    if (!profile) {
      throw new Error(`Tutor profile with ID ${profileId} not found`);
    }
    const typedProfile = profile;
    const content = this.buildTutorProfileContent(typedProfile);
    const metadata = this.buildTutorProfileMetadata(typedProfile);
    await this.upsertDocument(
      `tutor-profile-${profile.id}`,
      profile.id,
      profile.user.name,
      content,
      metadata
    );
    return {
      success: true,
      message: `Tutor profile "${profile.user.name}" indexed successfully`,
      tutorProfileId: profile.id
    };
  }
  async indexTutorProfileByUserId(userId) {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) {
      throw new Error(`Tutor profile for user ${userId} not found`);
    }
    return this.indexTutorProfileById(profile.id);
  }
  async indexAllTutorProfiles() {
    const profiles = await prisma.tutorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        reviews: {
          orderBy: {
            createdAt: "desc"
          },
          take: 5,
          select: {
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
    let indexedCount = 0;
    let failedCount = 0;
    for (const profile of profiles) {
      try {
        const typedProfile = profile;
        const content = this.buildTutorProfileContent(typedProfile);
        const metadata = this.buildTutorProfileMetadata(typedProfile);
        await this.upsertDocument(
          `tutor-profile-${profile.id}`,
          profile.id,
          profile.user.name,
          content,
          metadata
        );
        indexedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error(`Error indexing tutor profile ${profile.id}:`, error);
      }
    }
    return {
      success: true,
      totalProfiles: profiles.length,
      indexedCount,
      failedCount
    };
  }
  async deleteTutorProfileIndexById(profileId) {
    const result = await prisma.$executeRaw(prismaNamespace_exports.sql`
      UPDATE "document_embeddings"
      SET "isDeleted" = true,
          "deletedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE "chunkKey" = ${`tutor-profile-${profileId}`}
    `);
    return {
      success: true,
      tutorProfileId: profileId,
      updatedRows: Number(result)
    };
  }
  async deleteTutorProfileIndexByUserId(userId) {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) {
      return {
        success: true,
        tutorProfileId: null,
        updatedRows: 0
      };
    }
    return this.deleteTutorProfileIndexById(profile.id);
  }
  async getStats() {
    const totalDocuments = await prisma.$queryRaw(prismaNamespace_exports.sql`
      SELECT COUNT(*)::text AS count
      FROM "document_embeddings"
      WHERE "isDeleted" = false
        AND "sourceType" = ${SOURCE_TYPE}
    `);
    const sourceTypeCounts = await prisma.$queryRaw(prismaNamespace_exports.sql`
      SELECT "sourceType", COUNT(*)::text AS count
      FROM "document_embeddings"
      WHERE "isDeleted" = false
      GROUP BY "sourceType"
    `);
    return {
      sourceType: SOURCE_TYPE,
      totalActiveDocuments: Number(totalDocuments[0]?.count ?? 0),
      sourceTypeBreakdown: sourceTypeCounts.reduce(
        (accumulator, current) => {
          accumulator[current.sourceType] = Number(current.count);
          return accumulator;
        },
        {}
      ),
      timestamp: /* @__PURE__ */ new Date()
    };
  }
};

// src/modules/rag/llm.service.ts
var LLMService = class {
  apiKey = process.env.RAG_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "";
  apiUrl = "https://openrouter.ai/api/v1";
  model = process.env.RAG_OPENROUTER_LLM_MODEL ?? process.env.OPENROUTER_LLM_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free";
  async generateResponse(prompt, context = [], asJson = false) {
    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is missing. Set RAG_OPENROUTER_API_KEY or OPENROUTER_API_KEY."
      );
    }
    let fullPrompt = context.length > 0 ? `Context information:
${context.join("\n\n")}

Question: ${prompt}

Answer based on the context above.` : prompt;
    if (asJson) {
      fullPrompt += '\n\nReturn ONLY valid JSON with this shape: {"recommendations":[{"name":"Tutor Name","reason":"Why they fit","matchedCategories":["Category"],"strengths":["Strength"]}],"summary":"Short summary"}. Do not include markdown fences.';
    }
    const systemMessage = asJson ? "You are a helpful assistant for a tutoring marketplace. Answer using only the provided tutor profile context. Return only valid JSON." : "You are a helpful assistant for a tutoring marketplace. Answer using only the provided tutor profile context. If the context does not contain enough information, say so clearly.";
    const bodyPayload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    };
    if (asJson && (this.model.includes("gpt") || this.model.includes("openai"))) {
      bodyPayload.response_format = { type: "json_object" };
    }
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://skillbridge.local",
        "X-Title": "SkillBridge Tutor RAG"
      },
      body: JSON.stringify(bodyPayload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message ?? "unknown error";
      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorMessage}`
      );
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter did not return a completion");
    }
    return content;
  }
};

// src/modules/rag/rag.service.ts
var SOURCE_TYPE2 = "TUTOR_PROFILE";
var RAGService = class {
  embeddingService;
  indexingService;
  llmService;
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.indexingService = new IndexingService();
    this.llmService = new LLMService();
  }
  async indexTutorProfileById(profileId) {
    return this.indexingService.indexTutorProfileById(profileId);
  }
  async indexTutorProfileByUserId(userId) {
    return this.indexingService.indexTutorProfileByUserId(userId);
  }
  async indexAllTutorProfiles() {
    return this.indexingService.indexAllTutorProfiles();
  }
  async removeTutorProfileIndexById(profileId) {
    return this.indexingService.deleteTutorProfileIndexById(profileId);
  }
  async removeTutorProfileIndexByUserId(userId) {
    return this.indexingService.deleteTutorProfileIndexByUserId(userId);
  }
  async getStats() {
    return this.indexingService.getStats();
  }
  async retrieveRelevantTutorProfiles(query, limit = 5) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;
    return prisma.$queryRaw(prismaNamespace_exports.sql`
      SELECT
        id,
        "chunkKey",
        "sourceType",
        "sourceId",
        "sourceLabel",
        content,
        metadata,
        1 - (embedding <=> CAST(${vectorLiteral} AS vector)) AS similarity
      FROM "document_embeddings"
      WHERE "isDeleted" = false
        AND "sourceType" = ${SOURCE_TYPE2}
      ORDER BY embedding <=> CAST(${vectorLiteral} AS vector)
      LIMIT ${limit}
    `);
  }
  async generateAnswer(query, limit = 5, asJson = false) {
    const relevantDocs = await this.retrieveRelevantTutorProfiles(query, limit);
    if (relevantDocs.length === 0) {
      return {
        answer: asJson ? {
          recommendations: [],
          summary: "No indexed tutor profiles are available yet."
        } : "No indexed tutor profiles are available yet.",
        sources: [],
        contextUsed: false
      };
    }
    const context = relevantDocs.filter((document) => document.content).map((document) => document.content);
    let answer = await this.llmService.generateResponse(query, context, asJson);
    if (asJson) {
      try {
        if (answer.startsWith("```json")) {
          answer = answer.replace(/```json\n?/, "").replace(/```$/, "").trim();
        } else if (answer.startsWith("```")) {
          answer = answer.replace(/```\n?/, "").replace(/```$/, "").trim();
        }
        return {
          answer: JSON.parse(answer),
          sources: relevantDocs.map((document) => ({
            id: document.id,
            chunkKey: document.chunkKey,
            sourceType: document.sourceType,
            sourceId: document.sourceId,
            sourceLabel: document.sourceLabel,
            content: document.content,
            metadata: document.metadata,
            similarity: document.similarity
          })),
          contextUsed: context.length > 0
        };
      } catch (error) {
        console.error("Failed to parse LLM JSON response:", error);
        throw error;
      }
    }
    return {
      answer,
      sources: relevantDocs.map((document) => ({
        id: document.id,
        chunkKey: document.chunkKey,
        sourceType: document.sourceType,
        sourceId: document.sourceId,
        sourceLabel: document.sourceLabel,
        content: document.content,
        metadata: document.metadata,
        similarity: document.similarity
      })),
      contextUsed: context.length > 0
    };
  }
};

// src/modules/tutorProfile/profile.service.ts
var ragService = new RAGService();
var TutorProfileService = {
  create: async (userId, data) => {
    const profile = await prisma.tutorProfile.create({
      data: { ...data, userId }
    });
    try {
      await ragService.indexTutorProfileById(profile.id);
    } catch (error) {
      console.warn("Failed to index tutor profile after create:", error);
    }
    return profile;
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
    const profile = await prisma.tutorProfile.update({
      where: { userId },
      data
    });
    try {
      await ragService.indexTutorProfileById(profile.id);
    } catch (error) {
      console.warn("Failed to index tutor profile after update:", error);
    }
    return profile;
  },
  remove: async (userId) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    const result = await prisma.tutorProfile.delete({
      where: { userId }
    });
    if (profile) {
      try {
        await ragService.removeTutorProfileIndexById(profile.id);
      } catch (error) {
        console.warn("Failed to remove tutor profile index after delete:", error);
      }
    }
    return result;
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
router2.use(auth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */));
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
  },
  listReviewbyBookingId: async (tutorId, bookingId) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: tutorId },
      select: { id: true, avgRating: true, reviewCount: true }
    });
    if (!profile) throw new Error("Tutor profile not found");
    const items = await prisma.review.findMany({
      where: {
        bookingId,
        tutorProfileId: profile.id
        // 
      },
      orderBy: { createdAt: "desc" },
      take: 1,
      // ✅ one booking should have max 1 review (recommended)
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        student: { select: { id: true, name: true } },
        bookingId: true
      }
    });
    return {
      summary: {
        avgRating: profile.avgRating ?? 0,
        reviewCount: profile.reviewCount ?? 0
      },
      // ✅ return single review for this booking
      review: items[0] ?? null
    };
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
  },
  listReviewbyBookingId: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const bookingId = req.params.bookingId;
      const data = await TutorManageService.listReviewbyBookingId(req.user.id, bookingId);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  }
};

// src/modules/tutor/tutor.route.ts
var router3 = Router3();
router3.use(auth_default("TUTOR" /* TUTOR */));
router3.put("/profile", TutorManageController.updateProfile);
router3.get("/availability", auth_default("TUTOR" /* TUTOR */), TutorManageController.getAvailability);
router3.put("/availability", auth_default("TUTOR" /* TUTOR */), TutorManageController.setAvailability);
router3.put("/categories", auth_default("TUTOR" /* TUTOR */), TutorManageController.setCategories);
router3.get("/reviews/:bookingId", auth_default("TUTOR" /* TUTOR */), TutorManageController.listReviewbyBookingId);
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
  list: async (args = {}) => {
    const q = (args.q ?? "").trim();
    const categorySlug = (args.category ?? "").trim();
    const where = {
      ...q ? {
        OR: [
          { headline: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } }
        ]
      } : {},
      ...categorySlug ? {
        categories: {
          some: {
            category: {
              name: categorySlug,
              isActive: true
            }
          }
        }
      } : {}
    };
    const items = await prisma.tutorProfile.findMany({
      where,
      orderBy: { avgRating: "desc" },
      take: 100,
      select: {
        id: true,
        bio: true,
        headline: true,
        hourlyRate: true,
        currency: true,
        avgRating: true,
        reviewCount: true,
        user: { select: { id: true, name: true, image: true } },
        categories: { select: { category: { select: { name: true, slug: true } } } }
      }
    });
    return { items };
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
  },
  listReview: async (tutorUserId) => {
    const profile = await prisma.tutorProfile.findUnique({
      where: { id: tutorUserId },
      select: { id: true, avgRating: true, reviewCount: true }
    });
    if (!profile) throw new Error("Tutor profile not found");
    const items = await prisma.review.findMany({
      where: { tutorProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        student: { select: { id: true, name: true } },
        bookingId: true
      }
    });
    return {
      summary: {
        avgRating: profile.avgRating ?? 0,
        reviewCount: profile.reviewCount ?? 0
      },
      items
    };
  }
};

// src/modules/tutors/tutors.controller.ts
var TutorsController = {
  list: async (req, res) => {
    try {
      const q = (req.query.q ?? "").toString();
      const category = (req.query.category ?? "").toString();
      const args = {};
      if (q.trim()) args.q = q.trim();
      if (category.trim()) args.category = category.trim();
      const data = await TutorsService.list(args);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e?.message ?? "Failed"
      });
    }
  },
  details: async (req, res) => {
    try {
      const tutor = await TutorsService.details(req.params.id);
      return res.json({ success: true, data: tutor });
    } catch (e) {
      return res.status(404).json({ success: false, message: e?.message ?? "Tutor not found" });
    }
  },
  listReview: async (req, res) => {
    try {
      const data = await TutorsService.listReview(req.params.id);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  }
};

// src/modules/tutors/tutors.route.ts
var router5 = Router5();
router5.get("/", TutorsController.list);
router5.get("/:id", TutorsController.details);
router5.get("/reviews/:id", TutorsController.listReview);
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
router6.post("/", auth_default("STUDENT" /* STUDENT */), ReviewsController.create);
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
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
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
router7.get("/stats", auth_default("ADMIN" /* ADMIN */), AdminController.stats);
router7.get("/users", auth_default("ADMIN" /* ADMIN */), AdminController.listUsers);
router7.patch("/users/:id/status", auth_default("ADMIN" /* ADMIN */), AdminController.updateUserStatus);
router7.get("/bookings", auth_default("ADMIN" /* ADMIN */), AdminController.listBookings);
router7.get("/categories", auth_default("ADMIN" /* ADMIN */), AdminController.listCategories);
router7.post("/categories", auth_default("ADMIN" /* ADMIN */), AdminController.createCategory);
router7.patch("/categories/:id", auth_default("ADMIN" /* ADMIN */), AdminController.updateCategory);
router7.delete("/categories/:id", auth_default("ADMIN" /* ADMIN */), AdminController.deleteCategory);
var adminRouter = router7;

// src/modules/rag/rag.route.ts
import { Router as Router8 } from "express";

// src/modules/rag/rag.controller.ts
var ragService2 = new RAGService();
var RagController = {
  getStats: async (_req, res) => {
    try {
      const result = await ragService2.getStats();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Get RAG stats error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to retrieve RAG stats"
      });
    }
  },
  indexAllTutorProfiles: async (_req, res) => {
    try {
      const result = await ragService2.indexAllTutorProfiles();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Index all tutor profiles error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to index tutor profiles"
      });
    }
  },
  indexTutorProfile: async (req, res) => {
    try {
      const { profileId } = req.params;
      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: "profileId is required"
        });
      }
      const result = await ragService2.indexTutorProfileById(profileId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Index tutor profile error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to index tutor profile"
      });
    }
  },
  removeTutorProfileIndex: async (req, res) => {
    try {
      const { profileId } = req.params;
      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: "profileId is required"
        });
      }
      const result = await ragService2.removeTutorProfileIndexById(profileId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Remove tutor profile index error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to remove tutor profile index"
      });
    }
  },
  queryTutorProfiles: async (req, res) => {
    try {
      const { query, limit, asJson } = req.body;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required"
        });
      }
      const result = await ragService2.generateAnswer(
        query,
        limit ?? 5,
        asJson ?? true
      );
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Tutor profile RAG query error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message ?? "Failed to query tutor profiles"
      });
    }
  }
};

// src/modules/rag/rag.route.ts
var router8 = Router8();
router8.get("/stats", auth_default("ADMIN" /* ADMIN */), RagController.getStats);
router8.post("/index", auth_default("ADMIN" /* ADMIN */), RagController.indexAllTutorProfiles);
router8.post(
  "/index/:profileId",
  auth_default("ADMIN" /* ADMIN */, "TUTOR" /* TUTOR */),
  RagController.indexTutorProfile
);
router8.delete(
  "/index/:profileId",
  auth_default("ADMIN" /* ADMIN */, "TUTOR" /* TUTOR */),
  RagController.removeTutorProfileIndex
);
router8.post(
  "/query",
  auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  RagController.queryTutorProfiles
);
var ragRoutes = router8;

// src/middlewares/notFound.ts
function notFound(req, res) {
  res.status(404).json({
    message: "Route not found!",
    path: req.originalUrl,
    date: Date()
  });
}

// src/middlewares/globalErrorHandler.ts
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = err;
  if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "You provide incorrect field type or missing fields!";
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage = "An operation failed because it depends on one or more records that were required but not found.";
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "Duplicate key error";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key constraint failed";
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Error occurred during query execution";
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      errorMessage = "Authentication failed. Please check your creditials!";
    } else if (err.errorCode === "P1001") {
      statusCode = 400;
      errorMessage = "Can't reach database server";
    }
  }
  res.status(statusCode);
  res.json({
    message: errorMessage,
    error: errorDetails
  });
}
var globalErrorHandler_default = errorHandler;

// src/modules/users/users.route.ts
import { Router as Router9 } from "express";

// src/modules/users/users.service.ts
var UsersService = {
  getMe: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
        emailVerified: true,
        createdAt: true
      }
    });
    if (!user) throw new Error("User not found");
    return user;
  },
  updateMe: async (userId, dto) => {
    const data = {};
    if (dto.name !== void 0) data.name = dto.name;
    if (dto.phone !== void 0) data.phone = dto.phone;
    if (dto.image !== void 0) data.image = dto.image;
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
        emailVerified: true
      }
    });
  }
};

// src/modules/users/users.controller.ts
var UsersController = {
  me: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const user = await UsersService.getMe(req.user.id);
      return res.json({ success: true, data: user });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  },
  updateMe: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
      const updated = await UsersService.updateMe(req.user.id, req.body);
      return res.json({ success: true, message: "Profile updated", data: updated });
    } catch (e) {
      return res.status(400).json({ success: false, message: e?.message ?? "Failed" });
    }
  }
};

// src/modules/users/users.route.ts
var router9 = Router9();
router9.get("/me", auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */), UsersController.me);
router9.patch("/me", auth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */), UsersController.updateMe);
var userRouter = router9;

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
app.use("/api/rag", ragRoutes);
app.use("/api/users", userRouter);
app.get("/", (req, res) => {
  res.send("Skill Bridge!");
});
app.use(notFound);
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
