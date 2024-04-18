import mongoose from "mongoose";

const connectDB = async() => {
    try{
        const connnectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log("MONGODB connection SUCCESSFUL");
    }catch(error){
        console.log("MONGODB connection FAILED: ",error);
        process.exit(1)
    }
}

export default connectDB;