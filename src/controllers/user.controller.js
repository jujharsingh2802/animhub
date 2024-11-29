import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
 
const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Internal server error :: Something went wrong while generating Access and Refresh Tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // steps to be followed::
  //get user data from frontend
  //get/check validations - not empty
  //check if user already exists: username+email
  // check for images/avatar
  // upload to localserver
  // upload to cloudinary, check on avatar
  // create user object -create entry in db
  // remove password and refresh token field
  // check for user creation
  //  return response
  const { fullName, email, username, password } = req.body;
  console.log("body :", req.body);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    throw new ApiError(400, "Invalid email address");
  }

  const alreadyExists = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (alreadyExists) {
    throw new ApiError(409, "User already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  console.log("\nSUCCESSFULLY REGISTERED: ", user);
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  //  check if everything is valid
  // check if user or email exists -> if not user end it to register page
  //  check if the user's access token is valid //work of cookies
  //  if not valid also check the refresh token // work of cookies
  //  if valid, generate access token automatically and let user login
  //  if not valid check if password is correct
  //  if correct generate access and refresh tokens
  //  let user login
  //  return response with access and refresh tokens
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  };
  console.log("Logged in user details : ", loggedInUser);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear cookies, clear refresh token from database of that particular user
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .clearCookie("adminToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out!! "));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const receivedRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!receivedRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      receivedRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (user?.refreshToken !== receivedRefreshToken) {
      throw new ApiError(401, "Refresh Token is Expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    };
    const { accessToken, newRefreshToken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "AccessToken Refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});

const changePassword = asyncHandler(async(req, res) => {

  const {oldPassword, newPassword} = req.body
  console.log(req.body)
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})
  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "The current User has been fetched! ")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;
  if (!fullName && !username) {
    throw new ApiError(400, "Full Name is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        username,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account updated successfully!!"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(localPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(500, "Error while updating avatar");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully!!"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localPath = req?.file?.path;
  if (!localPath) {
    throw new ApiError(400, "Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(localPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Image updated successfully!!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }
  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: { 
          $cond: {
            if: {$in: [req.user?._id,"$subscribers.subscriber"]},
            then: true,
            else: false
          }
         },
      },
    },
    {
      $project:{
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        createdAt: 1
      }
    }
  ]);
  console.log(channel);
  if(!channel?.length){
    throw new ApiError(404, "Channel not found");
  }
  return res.status(200)
            .json(new ApiResponse(
              200,
              channel[0],
              "User channel fetched SUCCESSFULLY!!"
            ))
});

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match: {_id : new  mongoose.Types.ObjectId(req.user?._id)}
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline:[
          {
            $lookup:{
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline:[
                {
                  $project:{
                    fullName: 1,
                    username: 1,
                    avatar: 1, 
                  }
                }
              ]
            }
          },//minimizing work at frontend
          {
            $addFields:{
              owner:{
                $first: "$owner" // now object will be recieved at frontend(as owner)
              }
            }
          }
        ]
      }
    }
  ])
  return res.status(200)
          .json(new ApiResponse(
            200,
            user[0]?.watchHistory,
            "User's watch History fetched SUCCESSFULLY!!"
          ))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory

};
