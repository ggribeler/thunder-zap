const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function getToken(): string | null {
  return token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Auth ---

export async function register(email: string, password: string) {
  const data = await request<{ token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  token = data.token;
  return data;
}

export async function login(email: string, password: string) {
  const data = await request<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  token = data.token;
  return data;
}

// --- WhatsApp ---

export async function submitSignupCode(code: string) {
  return request<{ phoneNumberId: string }>("/api/whatsapp/signup-callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function getWhatsAppAccount() {
  return request<{
    connected: boolean;
    phoneNumberId?: string;
    wabaId?: string;
  }>("/api/whatsapp/account");
}

// --- Conversations ---

export interface Conversation {
  id: number;
  contact_phone: string;
  contact_name: string | null;
  last_message_at: string | null;
  last_message: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  direction: "inbound" | "outbound";
  content: string;
  timestamp: string;
}

export async function getConversations() {
  return request<Conversation[]>("/api/conversations");
}

export async function getMessages(conversationId: number) {
  return request<Message[]>(`/api/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: number, content: string) {
  return request<{ success: boolean }>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
}
