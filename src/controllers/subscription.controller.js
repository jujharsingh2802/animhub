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
export { toggleSubscription }
