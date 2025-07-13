import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { protect } from "../controllers/authController.js";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d", // Default to 7 days
    });

    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000 // Default to 7 days
      ),
      httpOnly: true,
      // secure: true, Only send the cookie over HTTPS, not HTTP
      // sameSite: 'None': Allow the cookie to be sent with cross-origin requests,
      // essential for different domains or ports
      // (like frontend and backend running on different ports during development).
      sameSite: "none",
      secure: "true",
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        token, // Include token in response
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getUser", protect, async (req, res) => {
  try {
    console.log(req.user);
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// get all users
router.get("/all", protect, async (req, res) => {
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

export default router;
