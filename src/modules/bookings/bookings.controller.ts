import { Request, Response } from "express"
import { error } from "node:console";
import { bookingRouter } from "./bookings.route";
import { bookingService } from "./bookings.service";

const createBooking = async (req: Request, res:Response ) => {
    try {
        if(!req.user)
             return  res.status(400).send({
                error: "unauthorized"
        })

        const result = await bookingService.createBooking(req.body);
        res.status(201).json(result);

    } catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
    }
}

const getAllBookings = async (req: Request, res:Response ) => {
    try {
            const posts = await bookingService.getAllBookings();
            res.status(200).json(posts);    
    } catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
    }   
}   



export const BookingController = {
    createBooking,
    getAllBookings  
}