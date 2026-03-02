"use client";

import { useEffect, useState } from "react";
import { Button, Alert, CircularProgress } from "@mui/material";
import { submitSignupCode } from "@/services/api";

declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { code: string };
          status: string;
        }) => void,
        params: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
        }
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

interface Props {
  onSuccess: () => void;
}

export default function EmbeddedSignup({ onSuccess }: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
      setSdkReady(true);
    };

    if (document.getElementById("facebook-jssdk")) {
      if (window.FB) setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  async function handleSignup() {
    setError("");
    setLoading(true);

    window.FB.login(
      async (response) => {
        if (response.authResponse?.code) {
          try {
            await submitSignupCode(response.authResponse.code);
            onSuccess();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Signup callback failed"
            );
          }
        } else {
          setError("Signup was cancelled or failed");
        }
        setLoading(false);
      },
      {
        config_id: process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID || "",
        response_type: "code",
        override_default_response_type: true,
      }
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Button
        variant="contained"
        color="secondary"
        size="large"
        fullWidth
        onClick={handleSignup}
        disabled={!sdkReady || loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading
          ? "Connecting..."
          : sdkReady
            ? "Connect WhatsApp"
            : "Loading..."}
      </Button>
    </>
  );
}
