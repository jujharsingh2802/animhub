import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index:true, //for searching fields
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: [true,'Please Enter your Full Name'],
        trim: true,
        index:true, //for searching fields
    },
    avatar: {
        type: String, // cloudnary url
        required: [true, 'Avatar Image is Required'],
    },
    coverImage:{
        type: String, // cloudnary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video" // reference to video model, so we can get video data from video model.
        }
    ],
    password: {
        type: String,
        required: true,
    },
    refreshToken:{
        type: String
    }
},{timestamps: true})

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw new ApiError(500, "Internal Server Error!!", error);
    }
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,  
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)