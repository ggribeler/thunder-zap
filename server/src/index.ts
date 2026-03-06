import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { getDb } from "./db/setup";
import authRoutes from "./routes/auth";
import whatsappRoutes from "./routes/whatsapp";
import conversationRoutes from "./routes/conversations";
import webhookRoutes from "./routes/webhook";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/webhook", webhookRoutes);

app.get("/api/health", (_req, res) => {
  console.log("[api-in] GET /health");
  console.log("[health] META_APP_ID:", process.env.META_APP_ID);
  console.log("[health] META_APP_SECRET:", process.env.META_APP_SECRET);
  console.log("[health] WEBHOOK_VERIFY_TOKEN:", process.env.WEBHOOK_VERIFY_TOKEN);
  console.log("[health] JWT_SECRET:", process.env.JWT_SECRET);
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Thunder ZAP API running on port ${PORT}`);
});
