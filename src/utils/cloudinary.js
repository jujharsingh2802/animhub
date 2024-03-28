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
            console.log("Error LocalFilePath couldn't be found")
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })
        console.log("File is uploaded SUCCESSFULLY",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved file if upload fails
        return null;
    }
}

export { uploadOnCloudinary }

