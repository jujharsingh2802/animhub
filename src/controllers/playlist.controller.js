import { mongoose, isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async(req,res)=>{
    let {name, description } = req?.body;

    if(!name){
        const playlistcounter = await Playlist.countDocuments({owner:req.user?._id});
        name = "Untitled Playlist " + (playlistcounter+1);
    }

    const playlist = await Playlist.create({
        name, 
        description: description || "",
        owner: req.user?._id
    });

    if(!playlist){
        throw new ApiError(500, "failed to create playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist ,"Playlist created"));
})

const updatePlaylist = asyncHandler(async(req,res)=>{
    const {name, description} = req.body;
    const { playlistId } = req.params;
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id");
    }

    if(!name && !description){
        throw new ApiError(400, "Name or Description is required when updating the playlist!");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    if(playlist.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(400,"Only owner can edit the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set:{
                name,
                description: description || ""
            }
        },
        {new: true}
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "Unfortunately Playlist couldn't be updated!" );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist Updated"));
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(400, "Playlist Not FOUND!!");
    }

    if(playlist?.owner.toString()!== req.user?._id.toString() ){
        throw new ApiError(400,"Only owner can edit the playlist");
    }

    await Playlist.findByIdAndDelete(playlist?._id);

    return res
        .status(200)
        .json(new ApiResponse(200, {} ,"Playlist was deleted Successfully!!!"));

})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId or PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist){
        throw new ApiError(404, "Playlist Does not exist");
    }
    if(!video){
        throw new ApiError(404, "Video cannot be found");
    }

    if(playlist?.owner.toString()!==req?.user?._id.toString()){
        throw new ApiError(400, "Only Owner can add video in the Playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet:{
                videos: videoId,
            }
        },
        {
            new: true
        }
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "Video Cannot be added, Please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist ,"Video added to playlist successfully"));
})
const removeVideoInPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "PlayList or Video's Id is not a valid objectId");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist Not Found!");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video Not Found!");
    }
    if(playlist?.owner.toString()!==req?.user?._id.toString()){
        throw new ApiError(400, "Only PlayList's owner can update the video");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {videos: videoId}
        },
        {new:true}
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "The request couldn't be completeted!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {updatedPlaylist}, "The Playlist has been updated successfully!!" ));
})

const getPlayListById = asyncHandler(async(req,res)=>{
    const {playlistId } = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist Not Found");
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match:{ _id: new mongoose.Types.ObjectId(playlistId)}
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $addFields:{
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum : "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1,
                videos: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    video: 1,
                }
                ,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos[0], "Playlist Videos Fetched Successfully!!"));
})

const getAllUserPlaylist = asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID");
    }
    const playlists = await Playlist.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields:{
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum : "$videos.views"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                _id:1,
                updatedAt: 1
            }
        }
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User's Playlists Fetched Successfully!!"));
})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoInPlaylist,
    getPlayListById,
    getAllUserPlaylist
}
