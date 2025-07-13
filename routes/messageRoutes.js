import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/global-messages", async (req, res) => {
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

export default router;
