"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteNotification,
  extractTextMessage,
  receiveNotification,
  sendMessage,
} from "@/lib/green-api-client";
import { clearCredentials, loadChats, saveChats } from "@/lib/storage";
import type { Chat, ChatMessage, Credentials } from "@/lib/types";
import { NewChatDialog } from "./NewChatDialog";

type Props = {
  credentials: Credentials;
  onLogout: () => void;
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatApp({ credentials, onLogout }: Props) {
  const [chats, setChats] = useState<Chat[]>(() =>
    loadChats(credentials.idInstance),
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadChats(credentials.idInstance)[0]?.chatId ?? null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveChats(credentials.idInstance, chats);
  }, [chats, credentials.idInstance]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function poll() {
      while (active && !controller.signal.aborted) {
        try {
          const notification = await receiveNotification(
            credentials,
            25,
            controller.signal,
          );
          setPollError(null);

          if (!notification) continue;

          try {
            await deleteNotification(credentials, notification.receiptId);
          } catch {
            // continue polling even if ack failed once
          }

          const body = notification.body;
          if (body?.typeWebhook !== "incomingMessageReceived") continue;

          const text = extractTextMessage(body);
          if (!text) continue;

          const chatId = body.senderData?.chatId;
          if (!chatId) continue;

          const phone = body.senderData?.senderPhoneNumber
            ? String(body.senderData.senderPhoneNumber)
            : "";
          const name =
            body.senderData?.chatName ||
            body.senderData?.senderName ||
            (phone ? `+${phone}` : chatId);

          setChats((prev) => {
            if (prev.some((chat) => chat.chatId === chatId)) {
              return prev.map((chat) =>
                chat.chatId === chatId ? { ...chat, name } : chat,
              );
            }
            return [{ chatId, phone, name }, ...prev];
          });

          setMessages((prev) => {
            if (prev.some((item) => item.id === body.idMessage)) return prev;
            return [
              ...prev,
              {
                id: body.idMessage || `${Date.now()}`,
                chatId,
                text,
                timestamp: (body.timestamp || Math.floor(Date.now() / 1000)) * 1000,
                direction: "incoming",
              },
            ];
          });

          setActiveChatId((current) => current ?? chatId);
        } catch (error) {
          if (controller.signal.aborted || !active) break;
          setPollError(
            error instanceof Error
              ? error.message
              : "Ошибка получения сообщений",
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    void poll();

    return () => {
      active = false;
      controller.abort();
    };
  }, [credentials]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.chatId === activeChatId) ?? null,
    [chats, activeChatId],
  );

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.chatId === activeChatId),
    [messages, activeChatId],
  );

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!activeChat || !draft.trim() || sending) return;

    const text = draft.trim();
    const tempId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      chatId: activeChat.chatId,
      text,
      timestamp: Date.now(),
      direction: "outgoing",
      status: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);

    try {
      const result = await sendMessage(credentials, activeChat.chatId, text);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempId
            ? {
                ...message,
                id: result.idMessage || tempId,
                status: "sent",
              }
            : message,
        ),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempId ? { ...message, status: "error" } : message,
        ),
      );
      setPollError(
        error instanceof Error ? error.message : "Не удалось отправить сообщение",
      );
    } finally {
      setSending(false);
    }
  }

  function handleCreated(chat: Chat) {
    setChats((prev) => {
      if (prev.some((item) => item.chatId === chat.chatId)) return prev;
      return [chat, ...prev];
    });
    setActiveChatId(chat.chatId);
    setShowNewChat(false);
  }

  function handleLogout() {
    clearCredentials();
    onLogout();
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <header className="sidebar__header">
          <div className="sidebar__brand">
            <div className="login__logo login__logo--sm" aria-hidden>
              M
            </div>
            <div>
              <strong>MAX</strong>
              <span>веб-чат</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar__logout"
            onClick={handleLogout}
          >
            Выйти
          </button>
        </header>

        <button
          type="button"
          className="sidebar__new"
          onClick={() => setShowNewChat(true)}
        >
          + Новый чат
        </button>

        <div className="sidebar__list">
          {chats.length === 0 ? (
            <p className="sidebar__empty">Пока нет чатов. Создайте первый.</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.chatId}
                type="button"
                className={`chat-item ${chat.chatId === activeChatId ? "is-active" : ""}`}
                onClick={() => setActiveChatId(chat.chatId)}
              >
                <div className="chat-item__avatar">
                  {(chat.name || chat.phone || "?").slice(0, 1)}
                </div>
                <div className="chat-item__meta">
                  <strong>{chat.name || chat.phone}</strong>
                  <span>{chat.phone ? `+${chat.phone}` : chat.chatId}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="chat">
        {activeChat ? (
          <>
            <header className="chat__header">
              <button
                type="button"
                className="ghost icon chat__back"
                onClick={() => setActiveChatId(null)}
                aria-label="К списку чатов"
              >
                ←
              </button>
              <div className="chat-item__avatar">
                {(activeChat.name || "?").slice(0, 1)}
              </div>
              <div>
                <strong>{activeChat.name}</strong>
                <span>
                  {activeChat.phone ? `+${activeChat.phone}` : activeChat.chatId}
                </span>
              </div>
            </header>

            <div className="chat__messages">
              {visibleMessages.length === 0 ? (
                <p className="chat__empty">Напишите первое сообщение</p>
              ) : (
                visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`bubble bubble--${message.direction} ${
                      message.status === "error" ? "bubble--error" : ""
                    }`}
                  >
                    <p>{message.text}</p>
                    <time>
                      {formatTime(message.timestamp)}
                      {message.status === "sending" ? " · отправка" : ""}
                      {message.status === "error" ? " · ошибка" : ""}
                    </time>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {pollError ? <p className="chat__status">{pollError}</p> : null}

            <form className="composer" onSubmit={handleSend}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Сообщение"
                maxLength={4000}
              />
              <button type="submit" disabled={sending || !draft.trim()}>
                Отправить
              </button>
            </form>
          </>
        ) : (
          <div className="chat__placeholder">
            <div className="login__logo" aria-hidden>
              M
            </div>
            <h2>Выберите или создайте чат</h2>
            <p>
              Здесь можно отправлять и получать только текстовые сообщения
              через GREEN-API
            </p>
            <button type="button" onClick={() => setShowNewChat(true)}>
              Новый чат
            </button>
          </div>
        )}
      </section>

      {showNewChat ? (
        <NewChatDialog
          credentials={credentials}
          onClose={() => setShowNewChat(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}
