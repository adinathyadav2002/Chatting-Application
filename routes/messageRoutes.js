import express from "express";
import { protect } from "../controllers/authController.js";
import { prisma } from "../db.js";
import { toIST } from "../utilities/time.js";

const router = express.Router();

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

    const formattedMessages = messages.map((msg) => ({
      ...msg,
      createdAt: toIST(msg.createdAt),
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching global messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get(
  "/private-messages/:userId/:anotherUserId",
  protect,
  async (req, res) => {
    const userId = parseInt(req.params.userId);
    const anotherUserId = parseInt(req.params.anotherUserId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (isNaN(anotherUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      const messages = await prisma.messages.findMany({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: anotherUserId,
            },
            {
              senderId: anotherUserId,
              receiverId: userId,
            },
          ],
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          createdAt: true,
          isRead: true,
          sender: true,
        },
      });
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching private messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

export default router;
