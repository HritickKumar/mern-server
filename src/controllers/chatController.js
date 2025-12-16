import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

// Get all chats of logged in user
export const getUserChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate("participants", "name email roles profileImageUrl")
            .sort({ lastMessageAt: -1 });

        res.json({ success: true, data: chats });
    } catch (err) {
        next(err);
    }
};

// Get messages of a chat
export const getChatMessages = async (req, res, next) => {
    try {
        const { chatId } = req.params;

        const messages = await Message.find({ chatId })
            .sort({ createdAt: 1 })
            .populate("sender receiver", "name email profileImageUrl");

        res.json({ success: true, data: messages });
    } catch (err) {
        next(err);
    }
};

// Create chat if not exists
export const createChatIfNotExists = async (req, res, next) => {
    try {
        const { otherUserId } = req.body;
        const userId = req.user.id;

        let chat = await Chat.findOne({
            participants: { $all: [userId, otherUserId] },
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [userId, otherUserId],
            });
        }

        const populatedChat = await Chat.findById(chat._id)
            .populate("participants", "name email roles");

        res.json({ success: true, data: populatedChat });
    } catch (err) {
        next(err);
    }
};


// Mark all unread messages as read
export const markMessagesAsRead = async (req, res, next) => {
    try {
        const { chatId } = req.params;

        await Message.updateMany(
            { chatId, receiver: req.user.id, seen: false },
            { seen: true }
        );

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
