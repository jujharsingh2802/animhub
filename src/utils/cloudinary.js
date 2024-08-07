import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
          
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

const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result;
    } catch (error) {
      throw new ApiError(500, "Error deleting file from Cloudinary");
    }
  };
export { uploadOnCloudinary, deleteFromCloudinary }

