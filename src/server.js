import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));


app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "API is working" });
});


app.use(notFound);

app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`Server running on port ${PORT}`);
    } catch (error) {
        console.error("Failed to connect to DB", error);
        process.exit(1);
    }
});
