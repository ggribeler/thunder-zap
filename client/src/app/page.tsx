"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Card, CardContent } from "@mui/material";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  function handleSuccess() {
    router.push("/onboarding");
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Card>
        <CardContent>
          {mode === "login" ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode("login")}
            />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
