import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            autoIndex: false,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};
