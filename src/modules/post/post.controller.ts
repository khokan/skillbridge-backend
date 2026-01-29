import { Request, Response } from "express"
import { postService } from "./post.service";
import { error } from "node:console";

const createPost = async (req: Request, res:Response ) => {
    try {
        if(!req.user)
             return  res.status(400).send({
                error: "unauthorized"
        })

        const result = await postService.createPost(req.body, req.user?.id as string);
        res.status(201).json(result);

    } catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
    }
}

const getAllPosts = async (req: Request, res:Response ) => {
    try {
            const posts = await postService.getAllPosts();
            res.status(200).json(posts);    
    } catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
    }   
}   



export const PostController = {
    createPost,
    getAllPosts
}