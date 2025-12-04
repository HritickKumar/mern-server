import dotenv from "dotenv";
dotenv.config();

export const {
    PORT,
    MONGO_URI,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES,
    NODE_ENV,
    CLIENT_URL
} = process.env;
