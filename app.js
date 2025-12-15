import dotenv from "dotenv";

import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import crypto from "crypto";
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

const io = new SocketIOServer(server, {
  cors: {
    // set two origins for CORS
    origin: [
      "http://localhost:5173", // Vite default
      "http://192.168.1.9:5173", // Network IP
      "http://13.233.154.37:5173",
      "http://chat.adinathyadav.xyz",
      "https://chat.adinathyadav.xyz", // ec2
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on("initiate video call", async (receiverId, callerId) => {
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

      const roomId = crypto.randomBytes(8).toString("hex");

      await prisma.messages.create({
        data: {
          content: "video Call",
          senderId: parseInt(callerId),
          receiverId: parseInt(receiverId),
          roomId,
          isGlobal: false,
        },
      });

      io.to(receiver.socketId).emit("want to video call", roomId);
    } catch (err) {
      console.log(err);
      console.log(`Error calling ${receiverId}`);
    }
  });

  socket.on("receive video call", async (receiverId, roomId) => {
    console.log("receiverd call");
    try {
      const message = await prisma.messages.findUnique({
        where: { roomId },
      });

      if (!message) {
        console.log("Invalid roomId:", roomId);
        return;
      }

      await prisma.messages.update({
        where: { roomId },
        data: { isRead: true },
      });
    } catch (err) {
      console.error("Error while receiving call:", err);
    }
  });

  socket.on("reject video call", async (receiverId, roomId) => {
    console.log("receiverd call");
    try {
      const message = await prisma.messages.findUnique({
        where: { roomId },
      });

      if (!message) {
        console.log("Invalid roomId:", roomId);
        return;
      }

      await prisma.messages.update({
        where: { roomId },
        data: { isRead: false },
      });
    } catch (err) {
      console.error("Error while receiving call:", err);
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

      console.log(`User ${userId} connected with socket ${socket.id}`);

      // ✅ Notify all connected clients that a new user is online
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
      const message = await prisma.messages.create({
        data: {
          content: msg.content,
          senderId: parseInt(msg.senderId),
          receiverId: parseInt(msg.receiverId),
          isGlobal: false,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // Get both sender and receiver socket info
      const [sender, receiver] = await Promise.all([
        prisma.user.findUnique({
          where: { id: parseInt(msg.senderId) },
        }),
        prisma.user.findUnique({
          where: { id: parseInt(msg.receiverId) },
        }),
      ]);

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
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://192.168.1.9:5173",
  "http://13.233.154.37:5173",
  "http://chat.adinathyadav.xyz",
  "https://chat.adinathyadav.xyz", // ec2
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
server.listen(port, () => {
  // logout all the users when the server starts
  prisma.user
    .updateMany({
      where: { isOnline: true, socketId: { not: null } },
      data: { isOnline: false, socketId: null },
    })
    .then(() => {})
    .catch((err) => {
      console.error("Error logging out users on server start:", err);
    });
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
