import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

let db: Database.Database;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || "./data/thunder.db";
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS whatsapp_accounts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      waba_id         TEXT NOT NULL,
      phone_number_id TEXT NOT NULL,
      access_token    TEXT NOT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      wa_account_id   INTEGER NOT NULL REFERENCES whatsapp_accounts(id),
      contact_phone   TEXT NOT NULL,
      contact_name    TEXT,
      last_message_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id),
      direction       TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
      content         TEXT NOT NULL,
      timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      wa_message_id   TEXT
    );
  `);

  // Seed test account
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("admin@thunderzap.com");
  if (!existing) {
    const hash = bcrypt.hashSync("thunder123", 10);
    db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(
      "admin@thunderzap.com",
      hash
    );
  }

  return db;
}
