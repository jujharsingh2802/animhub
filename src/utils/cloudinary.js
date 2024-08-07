import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.log(`Error localFilePath couldn't be Found!!`)
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })
        console.log("File is uploaded SUCCESSFULLY",response.url);
        fs.unlinkSync(localFilePath) //remove the locally saved file if upload is successful
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved file if upload fails
        return null;
    }
}

const deleteFromCloudinary = async (publicId, options = { resource_type: 'video' }) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, options);
        console.log(`File with public ID ${publicId} deleted successfully from Cloudinary`);
        return result;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw new ApiError(500, "Error deleting file from Cloudinary", error);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }

