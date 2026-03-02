import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import {
  getConversationsByUser,
  getConversationById,
  getMessagesByConversation,
  insertMessage,
  getWhatsAppAccountByUser,
} from "../db/queries";

const router = Router();

// List all conversations for the logged-in user
router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const conversations = getConversationsByUser(req.userId!);
  res.json(conversations);
});

// Get messages for a specific conversation
router.get(
  "/:id/messages",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const conversation = getConversationById(parseInt(id), req.userId!);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = getMessagesByConversation(conversation.id);
    res.json(messages);
  }
);

// Send a message in a conversation
router.post(
  "/:id/messages",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    const id = req.params.id as string;
    const conversation = getConversationById(parseInt(id), req.userId!);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const account = getWhatsAppAccountByUser(req.userId!);
    if (!account) {
      res.status(400).json({ error: "No WhatsApp account connected" });
      return;
    }

    try {
      // Send via WhatsApp Cloud API
      const waRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.phone_number_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: conversation.contact_phone,
            type: "text",
            text: { body: content },
          }),
        }
      );

      const waData = (await waRes.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message: string };
      };

      if (!waRes.ok) {
        res.status(502).json({
          error: waData.error?.message || "Failed to send message",
        });
        return;
      }

      const waMessageId = waData.messages?.[0]?.id;
      insertMessage(conversation.id, "outbound", content, waMessageId);

      res.json({ success: true });
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

export default router;
