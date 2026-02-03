# 🎓 SkillBridge – Backend

SkillBridge Backend is a modular, role-based REST API that powers the SkillBridge tutoring platform.  
It handles authentication, user management, tutor profiles, bookings, reviews, categories, and admin operations.

---

## 🚀 Core Responsibilities

- Authentication & authorization (Better Auth)
- Role-based access control (Student, Tutor, Admin)
- Tutor profile & availability management
- Booking lifecycle management
- Reviews & ratings aggregation
- Admin moderation & analytics
- PostgreSQL persistence via Prisma ORM

---

## 🧱 Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL (Neon DB)**
- **Better Auth (Session-based auth)**

---

## 🗂️ Project Structure

src/
├─ modules/
│ ├─ auth/
│ ├─ users/
│ ├─ tutors/
│ ├─ tutor-profile/
│ ├─ tutor-reviews/
│ ├─ bookings/
│ ├─ reviews/
│ ├─ categories/
│ └─ admin/
├─ middlewares/
│ └─ auth.ts
├─ lib/
│ ├─ prisma.ts
│ └─ auth.ts
├─ app.ts
└─ server.ts


---

## 🔐 Authentication & Authorization

- Uses **Better Auth**
- Session-based authentication via cookies
- Middleware injects `req.user`

### Supported Roles
- `STUDENT`
- `TUTOR`
- `ADMIN`

### Role Guard Example
```ts
router.get("/me", auth(UserRole.TUTOR), Controller.getMine);

🧭 API Routes Overview

🔓 Public
Method	Endpoint	Description
GET	/api/tutors	List tutors with filters
GET	/api/tutors/:id	Tutor public profile
GET	/api/categories	Active categories

👨‍🎓 Student (Private)
Method	Endpoint	Description
GET	/api/bookings	My bookings
POST	/api/bookings	Create booking
PATCH	/api/bookings/:id/cancel	Cancel booking
POST	/api/reviews	Create review
GET	/api/users/me	Get profile
PATCH	/api/users/me	Update profile

👨‍🏫 Tutor (Private)
Method	Endpoint	Description
GET	/api/tutor/profile/me	Tutor profile
POST	/api/tutor/profile	Create profile
PATCH	/api/tutor/profile	Update profile
DELETE	/api/tutor/profile	Delete profile
GET	/api/tutor/availability	Availability slots
PUT	/api/tutor/availability	Set availability
PATCH	/api/bookings/:id/complete	Mark booking complete
GET	/api/tutor/reviews	Ratings & reviews

🛡️ Admin (Private)
Method	Endpoint	Description
GET	/api/admin/users	Manage users
GET	/api/admin/bookings	All bookings
GET	/api/admin/categories	Categories
POST	/api/admin/categories	Create category
PATCH	/api/admin/categories/:id	Update category

🔁 Booking Lifecycle
Student → Book Session → CONFIRMED
Tutor   → Mark Complete → COMPLETED
Student → Leave Review

Booking Status

CONFIRMED

COMPLETED

CANCELLED

⭐ Reviews System

Students can review only COMPLETED bookings

One review per booking

Tutor rating auto-updated:

avgRating

reviewCount

📊 Categories

Created & managed by Admin

Assigned to tutors

Used by students to filter tutors

⚙️ Environment Variables
DATABASE_URL=
BETTER_AUTH_SECRET=

🧪 Error Handling

All controllers wrapped in try/catch

Consistent JSON response format

Prisma transactions for critical flows

▶️ Run Backend
pnpm install
pnpm prisma migrate dev
pnpm dev

✅ Production-Ready Principles

Modular architecture

Role-based middleware

Transaction-safe Prisma logic

Clean service-controller separation

📌 Future Improvements

Payments

Messaging

Tutor verification

Admin analytics