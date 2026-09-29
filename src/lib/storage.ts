import type { Chat, Credentials } from "./types";

const CREDENTIALS_KEY = "max-chat-credentials";
const CHATS_KEY = "max-chat-chats";

export function loadCredentials(): Credentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: Credentials) {
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function clearCredentials() {
  sessionStorage.removeItem(CREDENTIALS_KEY);
}

export function loadChats(idInstance: string): Chat[] {
  try {
    const raw = localStorage.getItem(`${CHATS_KEY}:${idInstance}`);
    if (!raw) return [];
    return JSON.parse(raw) as Chat[];
  } catch {
    return [];
  }
}

export function saveChats(idInstance: string, chats: Chat[]) {
  localStorage.setItem(`${CHATS_KEY}:${idInstance}`, JSON.stringify(chats));
}
