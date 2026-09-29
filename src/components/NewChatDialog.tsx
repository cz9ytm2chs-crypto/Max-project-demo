"use client";

import { FormEvent, useState } from "react";
import { checkAccount, normalizePhone } from "@/lib/green-api-client";
import type { Chat, Credentials } from "@/lib/types";

type Props = {
  credentials: Credentials;
  onClose: () => void;
  onCreated: (chat: Chat) => void;
};

export function NewChatDialog({ credentials, onClose, onCreated }: Props) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (!(normalized.length === 11 || normalized.length === 12)) {
      setError("Введите номер в международном формате, например 79991234567");
      return;
    }

    setLoading(true);
    try {
      const result = await checkAccount(credentials, Number(normalized));

      if (result.status === false) {
        setError(result.reason || "Инстанс не готов к проверке номера");
        return;
      }

      if (!result.exist || !result.chatId) {
        setError("У этого номера нет аккаунта в MAX");
        return;
      }

      onCreated({
        chatId: result.chatId,
        phone: normalized,
        name: `+${normalized}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать чат");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <button
        className="modal__backdrop"
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
      />
      <form className="modal__card" onSubmit={handleSubmit}>
        <h2>Новый чат</h2>
        <p>Укажите номер телефона получателя в MAX</p>
        <label>
          <span>Номер телефона</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79991234567"
            autoFocus
            required
          />
        </label>
        {error ? <p className="login__error">{error}</p> : null}
        <div className="modal__actions">
          <button type="button" className="ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Проверяем…" : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}
