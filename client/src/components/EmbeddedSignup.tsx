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

  function handleSignup() {
    console.log("[EmbeddedSignup] handleSignup called");
    console.log("[EmbeddedSignup] sdkReady:", sdkReady);
    console.log("[EmbeddedSignup] FB object:", typeof window.FB);
    console.log("[EmbeddedSignup] config_id:", process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID);
    setError("");
    setLoading(true);

    try {
      window.FB.login(
        (response) => {
          console.log("[EmbeddedSignup] FB.login callback fired");
          console.log("[EmbeddedSignup] response status:", response.status);
          console.log("[EmbeddedSignup] authResponse:", JSON.stringify(response.authResponse));

          if (response.authResponse?.code) {
            console.log("[EmbeddedSignup] Got auth code, submitting to backend...");
            submitSignupCode(response.authResponse.code)
              .then(() => {
                console.log("[EmbeddedSignup] submitSignupCode succeeded");
                onSuccess();
              })
              .catch((err) => {
                console.error("[EmbeddedSignup] submitSignupCode failed:", err);
                setError(
                  err instanceof Error ? err.message : "Signup callback failed"
                );
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            console.warn("[EmbeddedSignup] No auth code - signup cancelled or failed");
            setError("Signup was cancelled or failed");
            setLoading(false);
          }
        },
        {
          config_id: process.env.NEXT_PUBLIC_EMBEDDED_SIGNUP_CONFIG_ID || "",
          response_type: "code",
          override_default_response_type: true,
        }
      );
    } catch (err) {
      console.error("[EmbeddedSignup] FB.login threw:", err);
      setError(err instanceof Error ? err.message : "Failed to launch signup");
      setLoading(false);
    }
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
