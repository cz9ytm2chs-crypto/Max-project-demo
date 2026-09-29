import type { Credentials, GreenApiProxyRequest } from "./types";

async function callGreenApi<T>(payload: GreenApiProxyRequest): Promise<T> {
  const response = await fetch("/api/green-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    details?: unknown;
  } & T;

  if (!response.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : `Ошибка запроса к GREEN-API (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function resolveApiUrl(idInstance: string, apiUrl?: string): string {
  const trimmed = apiUrl?.trim().replace(/\/$/, "");
  if (trimmed) return trimmed;

  const digits = idInstance.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `https://${digits.slice(0, 4)}.api.green-api.com`;
  }

  return "https://api.green-api.com";
}

export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    digits = `7${digits.slice(1)}`;
  }
  return digits;
}

export async function getStateInstance(credentials: Credentials) {
  return callGreenApi<{ stateInstance?: string }>({
    ...credentials,
    method: "getStateInstance",
  });
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: number,
) {
  return callGreenApi<{
    exist?: boolean;
    chatId?: string;
    status?: boolean;
    reason?: string;
  }>({
    ...credentials,
    method: "checkAccount",
    body: { phoneNumber },
  });
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
) {
  return callGreenApi<{ idMessage?: string }>({
    ...credentials,
    method: "sendMessage",
    body: { chatId, message },
  });
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 25,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/green-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...credentials,
      method: "receiveNotification",
      receiveTimeout,
    } satisfies GreenApiProxyRequest),
    signal,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Ошибка получения уведомлений (${response.status})`,
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return data as {
    receiptId: number;
    body: {
      typeWebhook?: string;
      timestamp?: number;
      idMessage?: string;
      senderData?: {
        chatId?: string;
        chatName?: string;
        senderName?: string;
        senderPhoneNumber?: number;
      };
      messageData?: {
        typeMessage?: string;
        textMessageData?: { textMessage?: string };
        extendedTextMessageData?: { text?: string };
      };
    };
  };
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
) {
  return callGreenApi<{ result?: boolean }>({
    ...credentials,
    method: "deleteNotification",
    receiptId,
  });
}

export function extractTextMessage(body: {
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
}): string | null {
  const type = body.messageData?.typeMessage;
  if (type === "textMessage") {
    return body.messageData?.textMessageData?.textMessage ?? null;
  }
  if (type === "extendedTextMessage") {
    return body.messageData?.extendedTextMessageData?.text ?? null;
  }
  return null;
}
