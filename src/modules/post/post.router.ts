import express, { NextFunction, Request, Response } from 'express'
import { PostController } from './post.controller'
import auth, { UserRole } from '../../middlewares/auth'



const router = express.Router()

router.post("/",  PostController.createPost )
router.get("/", PostController.getAllPosts )

export const postRouter = router