import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async( req, res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        new ApiError(400, "Invalid VideoId");
    }

    const likeAlready = await Like.findOne({
            video: videoId,
            likedBy: req.user?._id,
    });

    if(likeAlready){
        await Like.findOneAndDelete(likeAlready._id);

        return res
            .status(200)
            .json(new ApiResponse(200,{isLiked:false},"Like has been removed"));
    }
    const liking = Like.create({
        video:videoId,
        likedBy: req?.user?._id
    })
    if(!liking){
        throw new ApiError(500, "There is some Difficulty Liking the video");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true} , "Liked the video"));
})

const toggleCommentLike = asyncHandler(async (req,res) => {
    const commentId = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id");
    }
    const isLikedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req?.user?._id
    });

    if(isLikedAlready){
        await Like.findByIdAndDelete(isLikedAlready._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {isLiked: false },"Like Removed"));
    }
    await Like.create({
        comment: commentId,
        likedBy: req?.user?._id
    })
    return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true}, "Like added"));
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const tweetId = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet Id");
    
    }
    const isLikedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req?.user?._id
    });

    if(isLikedAlready){
        await Like.findByIdAndDelete(isLikedAlready._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {isLiked: false }, "Like Removed"));
    }
    await Like.create({
        tweet: tweetId,
        likedBy: req?.user?._id
    })
    return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true}, "Like added"));
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const {page, limit} = req.query;

    const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
    }
    
    const AllLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        } 
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideo:{
                    _id:1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    }
                }
            }
        }
    ], options);

    return res
        .status(200)
        .json(new ApiResponse(200, AllLikedVideos, "Liked videos fetched successfully"));
})



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}