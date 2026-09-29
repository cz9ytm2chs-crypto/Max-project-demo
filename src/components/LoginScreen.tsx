"use client";

import { FormEvent, useState } from "react";
import {
  getStateInstance,
  resolveApiUrl,
} from "@/lib/green-api-client";
import type { Credentials } from "@/lib/types";

type Props = {
  onSuccess: (credentials: Credentials) => void;
};

export function LoginScreen({ onSuccess }: Props) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const credentials: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: resolveApiUrl(idInstance, apiUrl),
    };

    try {
      const state = await getStateInstance(credentials);
      if (state.stateInstance && state.stateInstance !== "authorized") {
        setError(
          `Инстанс в статусе «${state.stateInstance}». Авторизуйте его в личном кабинете GREEN-API.`,
        );
        return;
      }
      onSuccess(credentials);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось проверить учётные данные",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="login__logo" aria-hidden>
            M
          </div>
          <div>
            <h1>MAX</h1>
            <p>Веб-чат через GREEN-API</p>
          </div>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <label>
            <span>ID инстанса</span>
            <input
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              placeholder="3100123456"
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span>API-токен</span>
            <input
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              placeholder="Токен из личного кабинета"
              autoComplete="current-password"
              required
            />
          </label>

          <label>
            <span>Адрес API (необязательно)</span>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://3100.api.green-api.com"
            />
          </label>

          {error ? <p className="login__error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Проверяем…" : "Войти"}
          </button>
        </form>

        <p className="login__hint">
          Данные берутся из{" "}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
          . Чтобы получать сообщения через HTTP API, оставьте поле webhookUrl
          пустым.
        </p>
      </div>
    </main>
  );
}
