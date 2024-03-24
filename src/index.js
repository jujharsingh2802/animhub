import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env",
});

const app = express();

connectDB()














// using iify to avoid global scope

/*;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.error("Error: ", error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App's Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("Error: ", error);
        throw error
    }
})()*/