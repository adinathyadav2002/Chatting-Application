import dotenv from "dotenv";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { prisma } from "./db.js";

import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies
app.use(morgan("dev")); // HTTP request logger

const activeCalls = new Map();

const io = new SocketIOServer(server, {
  cors: {
    // set two origins for CORS
    origin: [
      process.env.LOCAL_IP_FRONTEND, // Vite default
      process.env.NETWORK_IP_FRONTEND,
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on(
    "initiate video call",
    async (receiverId, callerId, offer, roomId) => {
      if (!receiverId) {
        console.log("Receiver not  found");
        return;
      }

      // find the socket id of receiver with email
      try {
        const [sender, receiver] = await Promise.all([
          prisma.user.findUnique({
            where: { id: callerId },
          }),
          prisma.user.findUnique({
            where: { id: receiverId },
          }),
        ]);
        activeCalls.set(roomId, {
          callerSocketId: sender.socketId,
          receiverSocketId: receiver.socketId,
        });

        const message = await prisma.messages.create({
          data: {
            content: "video Call",
            senderId: parseInt(callerId),
            receiverId: parseInt(receiverId),
            roomId: roomId,
            isGlobal: false,
            isRead: "not-send",
          },
        });

        io.to(receiver.socketId).emit("want to video call", roomId, offer);
      } catch (err) {
        console.log(err);
        console.log(`Error calling ${receiverId}`);
      }
    }
  );

  socket.on("received video call", async (receiverId, roomId, ans) => {
    console.log("receiver call");
    try {
      const message = await prisma.messages.findUnique({
        where: { roomId },
      });

      const sender = await prisma.user.findFirst({
        where: { id: message.senderId },
      });

      if (!message) {
        console.log("Invalid roomId:", roomId);
        return;
      }

      await prisma.messages.update({
        where: { roomId },
        data: { isRead: true },
      });

      console.log(`answer ${ans}`);

      io.to(sender.socketId).emit("receiver accepted call", ans);
    } catch (err) {
      console.error("Error while receiving call:", err);
    }
  });

  socket.on("ended call", async (roomId) => {
    try {
      const call = activeCalls.get(roomId);
      if (!call) return;

      const message = await prisma.messages.findUnique({
        where: { roomId },
        include: {
          receiver: true,
          sender: true,
        },
      });

      const targetSocketId =
        socket.id === call.callerSocketId
          ? call.receiverSocketId
          : call.callerSocketId;

      socket.to(targetSocketId).emit("ended call");

      // Emit to receiver if they're online
      if (call.receiverSocketId) {
        io.to(call.receiverSocketId).emit("Private message", message);
      }

      // Emit to sender as well (confirmation that message was sent)
      if (call.callerSocketId) {
        io.to(call.callerSocketId).emit("Private message", message);
      }

      // delete the room info from map
      if (activeCalls.has(roomId)) {
        activeCalls.delete(roomId);
      }
    } catch (err) {
      console.error("Error while ending call:", err);
    }
  });

  socket.on("rejected video call", async (receiverId, roomId) => {
    try {
      const call = activeCalls.get(roomId);
      if (!call) return;

      const message = await prisma.messages.findUnique({
        where: { roomId },
        include: {
          receiver: true,
          sender: true,
        },
      });

      // remove the roomId from active
      if (!message) {
        console.log("Invalid roomId:", roomId);
        return;
      }

      const updatedMessage = await prisma.messages.update({
        where: { roomId },
        data: { isRead: false },
      });

      // Emit to receiver if they're online
      if (call.receiverSocketId) {
        io.to(call.receiverSocketId).emit("Private message", updatedMessage);
      }

      // Emit to sender as well (confirmation that message was sent)
      if (call.callerSocketId) {
        io.to(call.callerSocketId).emit("Private message", updatedMessage);
      }

      // delete the room info from map
      if (activeCalls.has(roomId)) {
        activeCalls.delete(roomId);
      }
    } catch (err) {
      console.error("Error while rejecting call:", err);
    }
  });

  socket.on("user connected", async (userData) => {
    try {
      let userId = parseInt(userData.userId);
      if (isNaN(userId)) {
        console.error("Invalid user ID:", userId);
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          socketId: socket.id,
          isOnline: true,
        },
      });

      // when user online update all the messages send by others to receiver should be marked as "send"
      await prisma.messages.updateMany({
        where: { receiverId: userId, isRead: "not-send" },
        data: {
          isRead: "send",
        },
      });

      // Notify all connected clients that a new user is online
      const onlineUsers = await prisma.user.findMany({
        where: { isOnline: true },
        select: { id: true, name: true },
      });

      console.log("Emitting online-users to all clients:", onlineUsers);
      // io.emit will send to all sockets (including the sender)
      io.emit("online-users", onlineUsers);
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  });

  socket.on("user disconnected", async (userData) => {
    try {
      let userId = parseInt(userData.userId || userData);
      if (isNaN(userId)) {
        console.error("Invalid user ID on disconnect:", userId);
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          socketId: null,
          isOnline: false,
        },
      });

      console.log(`User ${userId} manually disconnected`);

      // ✅ Notify all connected clients about updated online users
      const onlineUsers = await prisma.user.findMany({
        where: { isOnline: true },
        select: { id: true, name: true },
      });

      console.log(
        "Emitting online-users after manual disconnect:",
        onlineUsers
      );
      io.emit("online-users", onlineUsers);
    } catch (err) {
      console.error("Error updating user status on disconnect:", err);
    }
  });

  socket.on("read all messages", async (senderId, receiverId) => {
    try {
      // sender-iam receiver-other
      const sId = parseInt(senderId);
      const rId = parseInt(receiverId);

      // make all messages as read for the user
      const result = await prisma.messages.updateMany({
        where: {
          receiverId: sId,
          senderId: rId,
          isRead: { not: "read" },
        },
        data: {
          isRead: "read",
        },
      });

      //  Find sender socket
      const receiver = await prisma.user.findUnique({
        where: { id: rId },
        select: { socketId: true },
      });

      if (receiver?.socketId) {
        // Emit minimal
        console.log("send ->>>>>>>>> to sender");
        io.to(receiver.socketId).emit("messages read", {
          senderId: sId,
          receiverId: rId,
          count: result.count,
        });
      }
    } catch (error) {
      console.log("error in reading of messages of user " + error);
    }
  });

  socket.on("Global message", async (msg) => {
    // Validation check
    if (!msg || !msg.content || !msg.userId) {
      console.error("Invalid message data:", msg);
      return;
    }

    try {
      // Save message to the database
      const savedMessage = await prisma.messages.create({
        data: {
          content: msg.content,
          senderId: parseInt(msg.userId),
          receiverId: null, // No receiver for global message
          isGlobal: true,
          isRead: "send",
        },
        include: {
          sender: true, // Optional: include sender details (e.g. name, avatar)
        },
      });

      // Broadcast to all connected clients
      io.emit("Global message", savedMessage);
    } catch (error) {
      console.error("Error saving global message:", error);
    }
  });

  socket.on("Private message", async (msg) => {
    if (!msg || !msg.content || !msg.senderId || !msg.receiverId) {
      console.error("Invalid private message data:", msg);
      return;
    }

    try {
      // Get both sender and receiver socket info
      const [sender, receiver] = await Promise.all([
        prisma.user.findUnique({
          where: { id: parseInt(msg.senderId) },
        }),
        prisma.user.findUnique({
          where: { id: parseInt(msg.receiverId) },
        }),
      ]);

      const message = await prisma.messages.create({
        data: {
          content: msg.content,
          senderId: parseInt(msg.senderId),
          receiverId: parseInt(msg.receiverId),
          isGlobal: false,
          isRead: receiver.socketId ? "send" : "not-send",
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // Emit to receiver if they're online
      if (receiver?.socketId) {
        io.to(receiver.socketId).emit("Private message", message);
      }

      // Emit to sender as well (confirmation that message was sent)
      if (sender?.socketId) {
        io.to(sender.socketId).emit("Private message", message);
      }
    } catch (err) {
      console.error("Error sending private message:", err);
    }
  });

  socket.on("ice-candidate", async (data) => {
    const call = activeCalls.get(data.roomId);
    if (!call) return;

    const targetSocketId =
      socket.id === call.callerSocketId
        ? call.receiverSocketId
        : call.callerSocketId;

    socket.to(targetSocketId).emit("ice-candidate", {
      candidate: data.candidate,
    });
  });

  socket.on("disconnect", async () => {
    console.log("Socket disconnected:", socket.id);
    try {
      // remove the socket id from the user and make isOnline false
      const result = await prisma.user.updateMany({
        where: { socketId: socket.id },
        data: { isOnline: false, socketId: null },
      });

      console.log(
        `Updated ${result.count} user(s) to offline for socket ${socket.id}`
      );

      // ✅ Fetch and emit updated online users list
      const onlineUsers = await prisma.user.findMany({
        where: { isOnline: true },
        select: { id: true, name: true },
      });

      console.log(
        "Emitting online-users after socket disconnect:",
        onlineUsers
      );
      // io.emit will send to all remaining connected sockets
      io.emit("online-users", onlineUsers);
    } catch (err) {
      console.error("Error updating user on disconnect:", err);
    }
  });
});

const allowedOrigins = [
  process.env.NETWORK_IP_FRONTEND,
  process.env.LOCAL_IP_FRONTEND,
];

// set origin for CORS
app.use(
  cors({
    // origin: '*', for all origins
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 🔥 Important: Allows cookies
  })
);

const port = process.env.VITE_SERVER_PORT || 4000;
server.listen(port, "0.0.0.0", async () => {
  try {
    await prisma.user.updateMany({
      where: { isOnline: true, socketId: { not: null } },
      data: { isOnline: false, socketId: null },
    });
    console.log("Users logged out on server start");
  } catch (err) {
    console.error("Startup logout error:", err);
  }
});

app.use("/user", userRouter);
app.use("/messages", messageRouter);

// ****************************************************************
// import { connection } from "./db.js";
// connect to database in case of mysql
// connection.connect((err) => {
//   if (err) {
//     console.error("Error connecting to MySQL:", err.stack);
//     return;
//   }
// });
