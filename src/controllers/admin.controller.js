import jwt from 'jsonwebtoken';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const adminLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (username !== "admin" || password.toString() !== process.env.ADMIN_PASSWORD.toString()) {
        throw new ApiResponse(401, "Invalid credentials");
    }

    const token = jwt.sign(
        { status: "admin" },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" } 
    );

    return res
        .status(200)
        .cookie("adminToken", token, { httpOnly: true, maxAge: 3600 * 1000, secure: true }) 
        .json(new ApiResponse(200, "Login successful"));
});


export { adminLogin };


