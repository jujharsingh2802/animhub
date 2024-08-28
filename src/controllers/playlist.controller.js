import { mongoose, isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

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

    if(!name){
        throw new ApiError(400, "Name is required when updating it");
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

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist
}
