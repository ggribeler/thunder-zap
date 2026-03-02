"use client";

import { useState } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        gap: 1,
        p: 1.5,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "#f0f0f0",
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        sx={{ bgcolor: "#fff", borderRadius: 1 }}
      />
      <IconButton type="submit" color="primary" disabled={disabled || !text.trim()}>
        <SendIcon />
      </IconButton>
    </Box>
  );
}
