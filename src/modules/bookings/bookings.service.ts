import { Booking, Post } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createBooking = async (data: any) => {
    const result = await prisma.booking.create({
       data: {
              ...data        }
    })

    return result;
}

const getAllBookings = async () => {
    const bookings = await prisma.booking.findMany();
    return bookings;
}

export const bookingService = {
    getAllBookings,
    createBooking
}