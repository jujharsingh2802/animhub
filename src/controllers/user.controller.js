import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
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
  const createdUser = await User.findById(user._id)
  .select("-password -refreshToken")

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
  }
  console.log("\nSUCCESSFULLY REGISTERED: ",user);
  return res.status(201).json(
    new ApiResponse(200, createdUser ,"User registered successfully" )
  )


});

export { registerUser };
