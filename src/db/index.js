import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async() => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! \n DB HOST_ConnectionInstance: ${connectionInstance}`);
        console.log(`\n MongoDB connected !! \n DB HOST: ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("MongoDB connection failed",error);
        process.exit(1); //exit with failure error
    }
}
export default connectDB;
