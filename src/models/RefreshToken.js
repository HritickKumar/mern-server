import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        token: { type: String, index: true },
        userAgent: String,
        ip: String,
        expiresAt: { type: Date, index: { expires: 0 } }, // TTL index
    },
    { timestamps: true }
);

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
