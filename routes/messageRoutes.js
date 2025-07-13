import express from "express";
import { PrismaClient } from "@prisma/client";
import { protect } from "../controllers/authController.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/global-messages", protect, async (req, res) => {
  try {
    const messages = await prisma.messages.findMany({
      orderBy: { createdAt: "asc" },
      // isglobal is true
      where: { isGlobal: true },
      select: {
        id: true,
        content: true,
        sender: true,
        receiver: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        isGlobal: true,
      },
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching global messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/private-messages/:userId", protect, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          { senderId: userId, isGlobal: false },
          { receiverId: userId, isGlobal: false },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        sender: true,
        receiver: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        isGlobal: true,
      },
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching private messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
