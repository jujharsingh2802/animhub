import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Error while uploading video");
  }

  let thumbnailFile;
  if(!thumbnailLocalPath){
    thumbnailFile = cloudinary.url(videoFile.public_id, {
      resource_type: 'video',
      format: 'jpg',
      start_offset: '5', 
    });
  }
  else{
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
  }

  if(!thumbnailFile){
    throw new ApiError(400, "Error while generating or uploading the thumbnail")
  }
  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnailFile?.url,
    duration: videoFile?.duration,
    owner: req?.user?._id || "",
    isPublished: false
  });

  if (!video) {
    throw new ApiError(500, "Something went wrong while posting the video");
  }

  console.log("POSTED VIDEO SUCCESSFULLY!! ", video);

  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video Posted SUCCESSFULLY!!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "likedBy",
        as: "likes",
      },
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscribers",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
        ],
      },
    },
    {
      $project:{
        username:1,
        "avatar.url":1,
        subscribersCount:1,
        isSubscribed:1,

      }
    }
  ]);
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video Fetched SUCCESSFULLY!!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!videoId?.trim()){
    throw new ApiError(400, "Video id is required")
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "Video not found");
  }
  if(video.owner.toString() !== req.user?._id.toString()){
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  

  const videoPublicId = video.videoFile.split("/").pop().split(".")[0]; // Extract public ID from video URL : public id is usually stored as last element in cloudinary url with extension so this operation gets that
  const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
  
  await deleteFromCloudinary(videoPublicId, { resource_type: "video" });
  await deleteFromCloudinary(thumbnailPublicId, { resource_type: "image" });
  
  const videodelete = await Video.findByIdAndDelete(videoId);
  if(!videodelete){
    throw new ApiError(500, "Something went wrong while deleting the video! Please try again later!");
  }

  //TODO: ADD Functionality to delete from Likes and comment models too (after implementing them)

  return res
          .status(200)
          .json(new ApiResponse(200, {}, "Video Deleted SUCCESSFULLY!!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
