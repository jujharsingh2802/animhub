import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return {accessToken, refreshToken};

  } catch (error) {
    throw new ApiError(500, "Internal server error :: Something went wrong while generating Access and Refresh Tokens");
  }
}

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

const loginUser = asyncHandler(async (req,res) =>{
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
  const {email, username, password} = req.body

  if (!username && !email) {
    throw new ApiError(400, "username or email is required")
}
  const user = await User.findOne({
    $or: [{email}, {username}]
  });

  if(!user){
    throw new ApiError(404, "User not found")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials")
  }
  const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)


  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
  }
  console.log("Logged in user details : ",loggedInUser)
  return res.status(200)
  .cookie("accessToken", accessToken , options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully"
    )
  )

})

const logoutUser = asyncHandler(async (req,res)=>{
  // clear cookies, clear refresh token from database of that particular user
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      },
    },
    {
      new: true
    }
    )
    const options = {
      httpOnly: true,
      secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "User Logged Out!! "))
    
})

export { registerUser, loginUser, logoutUser };
