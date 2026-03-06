import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import {
  createWhatsAppAccount,
  getWhatsAppAccountByUser,
} from "../db/queries";

const router = Router();

const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;

// Exchange Embedded Signup code for access token and store WABA credentials
router.post(
  "/signup-callback",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const userId = req.userId!;

    console.log("[whatsapp/signup-callback] Received request from userId:", userId);
    console.log("[whatsapp/signup-callback] Code present:", !!code);

    if (!code) {
      console.warn("[whatsapp/signup-callback] No code provided");
      res.status(400).json({ error: "Code is required" });
      return;
    }

    try {
      // Exchange code for access token
      const tokenUrl = `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}`;
      console.log("[whatsapp/signup-callback] Exchanging code for token...");
      const tokenRes = await fetch(tokenUrl);
      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: { message: string };
      };

      console.log("[whatsapp/signup-callback] Token exchange status:", tokenRes.status);
      console.log("[whatsapp/signup-callback] Token received:", !!tokenData.access_token);
      if (tokenData.error) {
        console.error("[whatsapp/signup-callback] Token error:", tokenData.error.message);
      }

      if (!tokenData.access_token) {
        res.status(400).json({
          error: tokenData.error?.message || "Failed to exchange code",
        });
        return;
      }

      const accessToken = tokenData.access_token;

      // Get shared WABA info using the debug_token endpoint
      const debugUrl = `https://graph.facebook.com/v25.0/debug_token?input_token=${accessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`;
      console.log("[whatsapp/signup-callback] Fetching debug_token info...");
      const debugRes = await fetch(debugUrl);
      const debugData = (await debugRes.json()) as {
        data?: {
          granular_scopes?: Array<{
            scope: string;
            target_ids?: string[];
          }>;
        };
      };

      console.log("[whatsapp/signup-callback] Debug token status:", debugRes.status);
      console.log("[whatsapp/signup-callback] Granular scopes:", JSON.stringify(debugData.data?.granular_scopes));

      // Extract WABA ID from the granular scopes
      const wabaScope = debugData.data?.granular_scopes?.find(
        (s) => s.scope === "whatsapp_business_management"
      );
      const wabaId = wabaScope?.target_ids?.[0];

      console.log("[whatsapp/signup-callback] WABA ID:", wabaId);

      if (!wabaId) {
        console.error("[whatsapp/signup-callback] Could not determine WABA ID");
        res.status(400).json({ error: "Could not determine WABA ID" });
        return;
      }

      // Get phone numbers for this WABA
      const phonesUrl = `https://graph.facebook.com/v25.0/${wabaId}/phone_numbers?access_token=${accessToken}`;
      console.log("[whatsapp/signup-callback] Fetching phone numbers...");
      const phonesRes = await fetch(phonesUrl);
      const phonesData = (await phonesRes.json()) as {
        data?: Array<{ id: string; display_phone_number: string }>;
      };

      console.log("[whatsapp/signup-callback] Phone numbers status:", phonesRes.status);
      console.log("[whatsapp/signup-callback] Phone numbers found:", phonesData.data?.length ?? 0);
      if (phonesData.data?.[0]) {
        console.log("[whatsapp/signup-callback] First phone:", phonesData.data[0].display_phone_number, "id:", phonesData.data[0].id);
      }

      const phoneNumberId = phonesData.data?.[0]?.id;
      if (!phoneNumberId) {
        console.error("[whatsapp/signup-callback] No phone numbers found");
        res.status(400).json({ error: "No phone numbers found for this WABA" });
        return;
      }

      // Subscribe the app to the WABA's webhooks
      console.log("[whatsapp/signup-callback] Subscribing app to WABA webhooks...");
      const subRes = await fetch(
        `https://graph.facebook.com/v25.0/${wabaId}/subscribed_apps`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      console.log("[whatsapp/signup-callback] Subscribe status:", subRes.status);

      // Store in database
      console.log("[whatsapp/signup-callback] Storing account in database...");
      createWhatsAppAccount(userId, wabaId, phoneNumberId, accessToken);

      console.log("[whatsapp/signup-callback] Success! phoneNumberId:", phoneNumberId, "wabaId:", wabaId);
      res.json({ phoneNumberId, wabaId });
    } catch (err) {
      console.error("[whatsapp/signup-callback] Unhandled error:", err);
      res.status(500).json({ error: "Signup processing failed" });
    }
  }
);

// Check if user has a connected WhatsApp account
router.get("/account", authMiddleware, (req: AuthRequest, res: Response) => {
  const account = getWhatsAppAccountByUser(req.userId!);
  if (account) {
    res.json({
      connected: true,
      phoneNumberId: account.phone_number_id,
      wabaId: account.waba_id,
    });
  } else {
    res.json({ connected: false });
  }
});

export default router;
