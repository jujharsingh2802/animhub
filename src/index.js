import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env",
});

const app = express();

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.error("Error: ", error);
        throw error
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at PORT: ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("Mongo DB connection FAILED !!!", error);
    throw error

})














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