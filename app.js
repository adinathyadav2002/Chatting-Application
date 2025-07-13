import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";
import { on } from "events";

dotenv.config();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default
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
        select: { id: true, name: true }, // select only what you need
      });

      console.log(onlineUsers);

      // io.emit will send to all sockets (including the sender)
      io.emit("online-users", onlineUsers);
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // Broadcast to all clients
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

// set origin for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const port = process.env.VITE_SERVER_PORT || 4000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post("/user/register", async (req, res) => {
  const { name, email, password, avatar } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatar: avatar || null, // Optional avatar field
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/user/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// get all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        isOnline: true,
        socketId: true,
      },
    });
    res.status(200).json({ result: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

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
