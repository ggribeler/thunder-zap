"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import ConversationList from "@/components/ConversationList";
import MessageThread from "@/components/MessageThread";
import MessageInput from "@/components/MessageInput";
import {
  getToken,
  setToken,
  getConversations,
  getMessages,
  sendMessage,
  type Conversation,
  type Message,
} from "@/services/api";

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // token expired or invalid
    }
  }, []);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const data = await getMessages(convId);
      setMessages(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }

    loadConversations();

    // Poll for new conversations every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [router, loadConversations]);

  useEffect(() => {
    if (!selectedId) return;

    loadMessages(selectedId);

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => loadMessages(selectedId), 5000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  async function handleSend(content: string) {
    if (!selectedId) return;
    setSending(true);
    try {
      await sendMessage(selectedId, content);
      await loadMessages(selectedId);
      await loadConversations();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    setToken(null);
    router.push("/");
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Thunder ZAP
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel — conversation list */}
        <Paper
          square
          sx={{
            width: 360,
            minWidth: 360,
            borderRight: "1px solid",
            borderColor: "divider",
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Conversations
            </Typography>
          </Box>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Paper>

        {/* Right panel — message thread */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedConversation ? (
            <>
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#f5f5f5",
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedConversation.contact_name ||
                    selectedConversation.contact_phone}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedConversation.contact_phone}
                </Typography>
              </Box>
              <MessageThread messages={messages} />
              <MessageInput onSend={handleSend} disabled={sending} />
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#f0f0f0",
              }}
            >
              <Typography color="text.secondary">
                Select a conversation to view messages
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
