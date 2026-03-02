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
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Thunder ZAP API running on port ${PORT}`);
});
