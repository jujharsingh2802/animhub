import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Twitter } from "../models/twitter.model.js";

const createTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body;
    
    if(!content){
        throw new ApiError(400, "No content to add");
    }

    const tweet = await Twitter.create({
        content,
        owner: req.user?._id 
    })
    if(!tweet){
        throw new ApiError(500, "Tweet Cannot be created");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet Posted successfully"));

})

const updateTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body;
    const { tweetId } = req.params;
    
    if(!content){
        throw new ApiError(400, "No content to update!!");
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId");
    }
    const tweet = await Twitter.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not FOUND!!")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only Owner can Edit their tweet");
    }

    const updatedTweet = await Twitter.findByIdAndUpdate(
        { _id: tweet?._id },
        {
            $set:{
                content
            }
        },
        {new:true}
    );

    if(!updatedTweet){
        throw new ApiError(500, "Error updating the tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet Updated SUCCESSFULLY!!!"));
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "TweetId not valid");
    }
    console.log(tweetId)
    const tweet = await Twitter.findById(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet Not Found");
    }
    console.log(req.user?._id, tweet?.owner)
    if(req.user?._id?.toString() !== tweet?.owner?.toString() && req.user?.status !== "admin"){
        throw new ApiError(400, "Only Owner can delete their tweets");
    }

    const deletedTweet = await Twitter.findByIdAndDelete(tweet?._id);

    if(!deletedTweet){
        throw new ApiError(500, "Tweet Cannot be deleted");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet Deleted Successfully!!"));
})

const getAllTweets = asyncHandler( async(req,res) => {
    const {page = 1, limit = 10} = req.query;
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "UserId is not valid");
    }

    const twitterAggregate = await Twitter.aggregate([
        {
            $match:{
                owner: mongoose.Types.ObjectId(userId)
            } 
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar : 1
                        }
                    }
                ]
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline: [
                    {
                        $project:{
                            likedBy:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likesCount: {
                    $size: "$likes"
                },
                ownerDetails:{
                    $first: "$ownerDetails"
                },
                isLiked: {
                    $cond:{
                        $if:{$in:[req.user?._id, "likes.$likedBy"]},
                        then: true,
                        else : false
                    }
                }
            }
        },
        {
            $sort:{createdAt: -1}
        },
        {
            $project: {
                content:1,
                likesCount:1,
                ownerDetails:1,
                isLiked:1,
                createdAt: 1
            }
        }
    ]);

    if(!twitterAggregate){
        throw new ApiError(500,"Tweets Can't be fetched");
    }

    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    }

    const tweets = await Twitter.aggregatePaginate(
        twitterAggregate,
        options
    )
    
    return res
        .status(200)
        .json(new ApiResponse(200, tweets ,"Tweets fetched SUCCESSFULLY!!"));

})


export {getAllTweets, updateTweet, createTweet, deleteTweet};
