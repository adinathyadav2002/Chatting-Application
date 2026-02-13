import express from "express";
import { protect } from "../controllers/authController.js";
import { prisma } from "../db.js";
import { toIST } from "../utilities/time.js";

const router = express.Router();

router.get("/global-messages", protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [messages, totalCount] = await Promise.all([
      prisma.messages.findMany({
        orderBy: { createdAt: "desc" },
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
        skip,
        take: limit,
      }),
      prisma.messages.count({
        where: { isGlobal: true }
      })
    ]);
    // reverse the messages
    messages.reverse();

    const formattedMessages = messages.map((msg) => ({
      ...msg,
      createdAt: toIST(msg.createdAt),
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      messages: formattedMessages,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
    });
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (isNaN(anotherUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      const [messages, totalCount] = await Promise.all([
        prisma.messages.findMany({
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
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            senderId: true,
            receiverId: true,
            content: true,
            createdAt: true,
            isRead: true,
            sender: true,
          },
          skip,
          take: limit,
        }),
        prisma.messages.count({
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
        })
      ]);
      // reverse the messages
      messages.reverse();

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      res.status(200).json({
        messages,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          limit
        }
      });
    } catch (error) {
      console.error("Error fetching private messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

export default router;
