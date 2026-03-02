"use client";

import { useEffect, useRef } from "react";
import { Box, Typography, Paper } from "@mui/material";
import type { Message } from "@/services/api";

interface Props {
  messages: Message[];
}

export default function MessageThread({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">No messages yet</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        bgcolor: "#ece5dd",
      }}
    >
      {messages.map((msg) => (
        <Paper
          key={msg.id}
          elevation={1}
          sx={{
            p: 1.5,
            maxWidth: "70%",
            alignSelf:
              msg.direction === "outbound" ? "flex-end" : "flex-start",
            bgcolor: msg.direction === "outbound" ? "#dcf8c6" : "#fff",
            borderRadius: 2,
          }}
        >
          <Typography variant="body1">{msg.content}</Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "right", mt: 0.5 }}
          >
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Paper>
      ))}
      <div ref={bottomRef} />
    </Box>
  );
}
