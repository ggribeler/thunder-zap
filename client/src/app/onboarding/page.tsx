"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Alert,
} from "@mui/material";
import EmbeddedSignup from "@/components/EmbeddedSignup";
import { getWhatsAppAccount, getToken } from "@/services/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }

    getWhatsAppAccount()
      .then((data) => {
        if (data.connected) {
          router.push("/conversations");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  if (checking) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Connect Your WhatsApp
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Connect your WhatsApp Business phone number to start receiving and
            sending messages. Click the button below to begin the setup process.
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            You will be redirected to Meta to authorize your WhatsApp Business
            Account.
          </Alert>
          <EmbeddedSignup
            onSuccess={() => router.push("/conversations")}
          />
        </CardContent>
      </Card>
    </Container>
  );
}
