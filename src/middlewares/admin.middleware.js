import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminMid = asyncHandler(async (req, _, next) => {
    try {
        if (req.user?.status === "admin") {
            return next();
        }
        req.user = {};
        req.user.status = "user";
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});

