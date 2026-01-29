import express, { NextFunction, Request, Response } from 'express'

import auth, { UserRole } from '../../middlewares/auth'
import { BookingController } from './bookings.controller'



const router = express.Router()

router.post("/", BookingController.createBooking )
router.get("/", BookingController.getAllBookings )

export const bookingRouter = router