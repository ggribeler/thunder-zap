"use client";

import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import type { Conversation } from "@/services/api";

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: Props) {
  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          No conversations yet. Messages will appear here when someone sends you
          a WhatsApp message.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {conversations.map((conv) => (
        <div key={conv.id}>
          <ListItemButton
            selected={conv.id === selectedId}
            onClick={() => onSelect(conv.id)}
            sx={{ py: 1.5 }}
          >
            <ListItemText
              primary={conv.contact_name || conv.contact_phone}
              secondary={conv.last_message || "No messages"}
              primaryTypographyProps={{ fontWeight: 500 }}
              secondaryTypographyProps={{
                noWrap: true,
                sx: { maxWidth: 200 },
              }}
            />
            {conv.last_message_at && (
              <Typography variant="caption" color="text.secondary">
                {new Date(conv.last_message_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            )}
          </ListItemButton>
          <Divider />
        </div>
      ))}
    </List>
  );
}
