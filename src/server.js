import { PORT } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { JWT_ACCESS_SECRET } from "./config/env.js";
import { chatSocketHandler } from "./sockets/chatSockets.js";




const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

// Socket Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) return next(new Error("No token provided"));

        const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.sub);

        if (!user) return next(new Error("User not found"));

        socket.user = {
            id: user._id.toString(),
            email: user.email,
            roles: user.roles,
        };

        next();
    } catch (err) {
        next(new Error("Unauthorized socket connection"));
    }
});

io.on("connection", (socket) => {
    console.log(`✅ New client connected! Socket ID: ${socket.id}`);
    console.log("Connected user token:", socket.handshake.auth.token?.slice(0, 20) + "...");
    chatSocketHandler(io, socket);
});

// Main socket connection
// io.on("connection", (socket) => {
//     console.log("User connected:", socket.user.email);

//     // Join user-specific room
//     socket.join(`user_${socket.user.id}`);

//     // Notify all admins about active user
//     io.emit("user:online", { userId: socket.user.id });

//     // Handle disconnect
//     socket.on("disconnect", () => {
//         console.log("User disconnected:", socket.user.email);
//         io.emit("user:offline", { userId: socket.user.id });
//     });

//     // Example: user sends message
//     socket.on("client:message", (data) => {
//         console.log("Message from client:", data);
//     });

//     // Example: admin message to user
//     socket.on("admin:sendUserMessage", ({ userId, message }) => {
//         io.to(`user_${userId}`).emit("server:userMessage", {
//             from: socket.user.id,
//             message,
//         });
//     });
// });

connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
