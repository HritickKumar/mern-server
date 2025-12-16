// sockets/chatSocket.js
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

export const chatSocketHandler = (io, socket) => {
    const userId = socket.user.id;

    socket.join(`user_${userId}`);

    // SEND MESSAGE
    socket.on("chat:send", async ({ chatId, receiverId, text }) => {
        const msg = await Message.create({
            chatId,
            sender: userId,
            receiver: receiverId,
            text,
        });

        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: text,
            lastMessageAt: new Date(),
        });

        // Send message to BOTH sides
        io.to(`user_${userId}`).emit("chat:newMessage", msg);
        io.to(`user_${receiverId}`).emit("chat:newMessage", msg);

        //  SEND NOTIFICATION TO RECEIVER
        io.to(`user_${receiverId}`).emit("chat:notification", {
            chatId,
            from: userId,
            text,
        });
    });
};
