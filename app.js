import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";

import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

dotenv.config();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies

const io = new SocketIOServer(server, {
  cors: {
    // set two origins for CORS
    origin: [
      "http://localhost:5173", // Vite default
      "http://192.168.1.9:5173", // Network IP (removed trailing slash)
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

      console.log(`User ${userId} is online with socket ID: ${socket.id}`);

      // ✅ Notify all connected clients that a new user is online
      const onlineUsers = await prisma.user.findMany({
        where: { isOnline: true },
        select: { id: true, name: true },
      });

      console.log(onlineUsers);

      // io.emit will send to all sockets (including the sender)
      io.emit("online-users", onlineUsers);
    } catch (err) {
      console.error("Error updating user status:", err);
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

      console.log("Saved to database:", savedMessage);

      // Broadcast to all connected clients
      io.emit("Global message", savedMessage);
    } catch (error) {
      console.error("Error saving global message:", error);
    }
  });

  socket.on("Private message", async (msg) => {
    console.log("Received private message:", msg);
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

      console.log("Sender socket:", sender?.socketId);
      console.log("Receiver socket:", receiver?.socketId);

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
    // remove the socket id from the user and make isOnline false
    prisma.user
      .updateMany({
        where: { socketId: socket.id },
        data: { isOnline: false, socketId: null },
      })
      .then(() => {
        console.log(`User disconnected: ${socket.id}`);
      })
      .catch((err) => {
        console.error("Error updating user on disconnect:", err);
      });

    // ✅ send
    const onlineUsers = await prisma.user.findMany({
      // is online is true and socketId is not equal to current socket id
      where: { isOnline: true, socketId: { not: socket.id } },
      select: { id: true, name: true }, // select only what you need
    });

    console.log(onlineUsers);

    // io.emit will send to all sockets (including the sender)
    io.emit("online-users", onlineUsers);
  });
});

const allowedOrigins = ["http://127.0.0.1:5173", "http://localhost:5173"];

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
  console.log(`Server is running on http://localhost:${port}`);
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
//   console.log("Connected to MySQL as id " + connection.threadId);
// });
