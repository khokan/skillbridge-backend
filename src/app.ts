import express, { Application } from "express";
import { toNodeHandler } from "better-auth/node";
import cors from 'cors';
import { auth } from "./lib/auth";
import { bookingRouter } from "./modules/bookings/bookings.route";
import { profileRouter } from "./modules/tutorProfile/profile.router";
import { tutorRoutes } from "./modules/tutor/tutor.route";
import { categoriesRoutes } from "./modules/categories/categories.route";
import { tutorsRoutes } from "./modules/tutors/tutors.route";
import { reviewRoutes } from "./modules/reviews/reviews.route";
import { adminRouter } from "./modules/admin/admin.route";
import { ragRoutes } from "./modules/rag/rag.route";
import { notFound } from "./middlewares/notFound";
import errorHandler from "./middlewares/globalErrorHandler";
import { userRouter } from "./modules/users/users.route";



const app: Application = express();


app.use(cors({
    origin: process.env.APP_URL || "http://localhost:3000", // client side url
    credentials: true
}))


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

app.use(notFound)
app.use(errorHandler)

export default app;