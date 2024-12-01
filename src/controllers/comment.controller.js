import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const viewComments = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;
    const { page = 1, limit = 10 } = req.query;

    const commentsAggregate = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond:{
                        if:{ $in: [req?.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $sort: {
            createdAt: -1
            }
        },
        {
            $project:{
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200,comments,"Comments has been fetched SUCCCESSFULLY!!"));

})

const addComment = asyncHandler(async (req,res) =>{
    const { content } = req.body;
    const {videoId} = req.params;

    if(!content){
        throw new ApiError(400, "Content not found");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video Not Found!!");
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner: req?.user?._id
    })

    if(!comment){
        throw new ApiError(500, "Error adding the comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment,"Comment Has been added"));
})

const updateComment = asyncHandler( async (req,res)=>{
    const {content} = req.body;
    const { commentId } = req.params;

    if(!content){
        throw new ApiError(400, "No Content to Update");
    }
   
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment Not Found!!");
    }
    
    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only comment owner can edit the comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        { _id: comment?._id },
        {
            $set:{
                content
            }   
        },
        {new:true}
    )

    if(!updatedComment){
        throw new ApiError(500, "Failed to Update the Comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment,"Comment Updated SUCCESSFULLY!!"));
})

const deleteComment = asyncHandler(async (req,res)=>{
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment Not Found");
    }
    console.log(comment?.owner)
    if(comment?.owner?.toString() !== req?.user?._id?.toString()  && req?.user?.status !== "admin"){
        throw new ApiError(400, "Only comment owner can delete the comment");
    }
    await Comment.findByIdAndDelete(comment?._id);

    if(req?.user?._id) {
            await Like.deleteMany({
            comment: commentId,
            likedBy: req?.user?._id || ""
        })
    }
    return res
        .status(200)
        .json(new ApiError(200, { commentId }, "The comment has been deleted"));
    
})

export {
    addComment,
    updateComment,
    deleteComment,
    viewComments
}