import { getDb } from "./setup";

// --- Users ---

export function createUser(email: string, passwordHash: string) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO users (email, password_hash) VALUES (?, ?)"
  );
  return stmt.run(email, passwordHash);
}

export function getUserByEmail(email: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as
    | { id: number; email: string; password_hash: string; created_at: string }
    | undefined;
}

// --- WhatsApp Accounts ---

export function createWhatsAppAccount(
  userId: number,
  wabaId: string,
  phoneNumberId: string,
  accessToken: string
) {
  const db = getDb();
  return db
    .prepare(
      "INSERT INTO whatsapp_accounts (user_id, waba_id, phone_number_id, access_token) VALUES (?, ?, ?, ?)"
    )
    .run(userId, wabaId, phoneNumberId, accessToken);
}

export function getWhatsAppAccountByUser(userId: number) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM whatsapp_accounts WHERE user_id = ?")
    .get(userId) as
    | {
        id: number;
        user_id: number;
        waba_id: string;
        phone_number_id: string;
        access_token: string;
      }
    | undefined;
}

export function getWhatsAppAccountByPhoneNumberId(phoneNumberId: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM whatsapp_accounts WHERE phone_number_id = ?")
    .get(phoneNumberId) as
    | {
        id: number;
        user_id: number;
        waba_id: string;
        phone_number_id: string;
        access_token: string;
      }
    | undefined;
}

// --- Conversations ---

export function getConversationsByUser(userId: number) {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, m.content as last_message
       FROM conversations c
       LEFT JOIN messages m ON m.id = (
         SELECT id FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1
       )
       WHERE c.user_id = ?
       ORDER BY c.last_message_at DESC`
    )
    .all(userId) as Array<{
    id: number;
    user_id: number;
    wa_account_id: number;
    contact_phone: string;
    contact_name: string | null;
    last_message_at: string | null;
    last_message: string | null;
  }>;
}

export function getConversationById(id: number, userId: number) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?")
    .get(id, userId) as
    | {
        id: number;
        user_id: number;
        wa_account_id: number;
        contact_phone: string;
        contact_name: string | null;
      }
    | undefined;
}

export function findOrCreateConversation(
  userId: number,
  waAccountId: number,
  contactPhone: string,
  contactName: string | null
) {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT * FROM conversations WHERE user_id = ? AND wa_account_id = ? AND contact_phone = ?"
    )
    .get(userId, waAccountId, contactPhone) as { id: number } | undefined;

  if (existing) return existing;

  const result = db
    .prepare(
      "INSERT INTO conversations (user_id, wa_account_id, contact_phone, contact_name, last_message_at) VALUES (?, ?, ?, ?, datetime('now'))"
    )
    .run(userId, waAccountId, contactPhone, contactName);

  return { id: result.lastInsertRowid as number };
}

// --- Messages ---

export function getMessagesByConversation(conversationId: number) {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC"
    )
    .all(conversationId) as Array<{
    id: number;
    conversation_id: number;
    direction: "inbound" | "outbound";
    content: string;
    timestamp: string;
    wa_message_id: string | null;
  }>;
}

export function insertMessage(
  conversationId: number,
  direction: "inbound" | "outbound",
  content: string,
  waMessageId?: string
) {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO messages (conversation_id, direction, content, wa_message_id) VALUES (?, ?, ?, ?)"
    )
    .run(conversationId, direction, content, waMessageId || null);

  db.prepare(
    "UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?"
  ).run(conversationId);

  return result;
}
