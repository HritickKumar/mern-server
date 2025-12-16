import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
    getUserChats,
    getChatMessages,
    createChatIfNotExists,
    markMessagesAsRead,
} from "../controllers/chatController.js";

const router = express.Router();

// all routes require auth
router.use(auth);

// get all chat conversations for a user
router.get("/list", getUserChats);

// get messages of a specific chat
router.get("/:chatId/messages", getChatMessages);

// create chat from user to admin if not exists
router.post("/create", createChatIfNotExists);

// mark messages as read
router.post("/:chatId/read", markMessagesAsRead);

export default router;
