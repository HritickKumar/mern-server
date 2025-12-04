import mongoose from "mongoose";

export const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("MONGO_URI is not defined in .env");
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};
