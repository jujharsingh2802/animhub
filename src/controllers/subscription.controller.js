import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req,res)=>{
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Video Id not Valid");
    }
    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(new ApiResponse(200, {subscribed: false} , "Unsubscribed SUCCESSFULLY!!"));
    }

    const subscribed = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })
    
    if(!subscribed){
        throw new ApiError( 500, "Can't subscribe Right now For some reason");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {subscribed: true}, "Subscribed SuceessFully!!"));
})

const getUserSubscribers = asyncHandler(async(req,res)=>{
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id");
    }
    const getSubs = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId)}
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        },
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber:{
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId,
                                            "$subscribedToSubscriber.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false
                                },
                            },
                            subscriberCount: {
                                $size: "$subscribedToSubscriber"
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    subscribedToSubscriber: 1,
                    subscriberCount: 1,
                }
            }
        }
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, getSubs, "Subscribers fetched Suceessfully!!"));
})

// return channels user has subscribed
const getSubscribedChannels = asyncHandler(async(req, res)=>{
    const { subscribedId } = req.params;
    if(!isValidObjectId(subscribedId)){
        throw new ApiError(400, "Invalid Subscribed");
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(subscribedId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup : {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos",
                            },
                        },
                    },
                ]

            }
        },
        {
            $unwind: "$subscribedChannel"
        },
        {
            $project:{
                _id:0,
                subscribedChannel:{
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar : 1,
                    latestVideo : {
                        _id: 1,
                        title: 1,
                        thumbnail: 1,
                        duration: 1,
                        views: 1,
                        createdAt: 1,
                        description: 1,
                        videoFile: 1,
                        owner: 1
                    }

                }
            }
        }
    ]);

    return res
        .status(200)
        .json(200, new ApiResponse(200, subscribedChannels, "Subscribed Channels Fetched SuccessFully!!!"));
})


export { toggleSubscription , getUserSubscribers , getSubscribedChannels}
