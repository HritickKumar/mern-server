// scripts/seedAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../src/models/User.js";
import { MONGO_URI } from "../src/config/env.js";

dotenv.config();

const run = async () => {
    await mongoose.connect(MONGO_URI);
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD

    let user = await User.findOne({ email });
    if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await User.create({
            email,
            passwordHash,
            name: "Administrator",
            roles: ["admin"],
            isMFAEnabled: false,
            isMfaRequired: false,
        });
        console.log("Admin user created:", email);
    } else {
        user.roles = Array.from(new Set([...user.roles, "admin"]));
        await user.save();
        console.log("Admin user updated (roles ensured):", email);
    }
    await mongoose.disconnect();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
