import { Router, Request, Response } from "express";
import {
  getWhatsAppAccountByPhoneNumberId,
  findOrCreateConversation,
  insertMessage,
} from "../db/queries";

const router = Router();

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "thunder-zap-verify";

// Webhook verification (Meta sends GET to verify the endpoint)
router.get("/", (req: Request, res: Response) => {
  console.log("[api-in] GET /webhook", JSON.stringify(req.query));
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive incoming WhatsApp messages
router.post("/", (req: Request, res: Response) => {
  const body = req.body;
  console.log("[api-in] POST /webhook", JSON.stringify({ object: body.object }));

  if (body.object !== "whatsapp_business_account") {
    res.sendStatus(404);
    return;
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const account = getWhatsAppAccountByPhoneNumberId(phoneNumberId);
      if (!account) continue;

      for (const message of value.messages || []) {
        const senderPhone = message.from;
        const contactName =
          value.contacts?.find(
            (c: { wa_id: string; profile?: { name?: string } }) =>
              c.wa_id === senderPhone
          )?.profile?.name || null;

        const conversation = findOrCreateConversation(
          account.user_id,
          account.id,
          senderPhone,
          contactName
        );

        const content =
          message.type === "text"
            ? message.text?.body || ""
            : `[${message.type}]`;

        insertMessage(conversation.id, "inbound", content, message.id);
      }
    }
  }

  res.sendStatus(200);
});

export default router;
