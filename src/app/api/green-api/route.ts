import { NextRequest, NextResponse } from "next/server";
import type { GreenApiProxyRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildUrl(payload: GreenApiProxyRequest): string {
  const base = payload.apiUrl.replace(/\/$/, "");
  const { idInstance, apiTokenInstance, method, receiptId, receiveTimeout } =
    payload;

  switch (method) {
    case "getStateInstance":
      return `${base}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`;
    case "checkAccount":
      return `${base}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`;
    case "sendMessage":
      return `${base}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    case "receiveNotification": {
      const timeout = Math.min(Math.max(receiveTimeout ?? 25, 5), 60);
      return `${base}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=${timeout}`;
    }
    case "deleteNotification":
      return `${base}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;
    default:
      throw new Error("Неподдерживаемый метод");
  }
}

export async function POST(request: NextRequest) {
  let payload: GreenApiProxyRequest;

  try {
    payload = (await request.json()) as GreenApiProxyRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  if (
    !payload?.apiUrl ||
    !payload?.idInstance ||
    !payload?.apiTokenInstance ||
    !payload?.method
  ) {
    return NextResponse.json(
      { error: "Укажите apiUrl, idInstance, apiTokenInstance и method" },
      { status: 400 },
    );
  }

  let url: string;
  try {
    url = buildUrl(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Некорректный запрос",
      },
      { status: 400 },
    );
  }

  const init: RequestInit = {
    method:
      payload.method === "receiveNotification" ||
      payload.method === "getStateInstance"
        ? "GET"
        : payload.method === "deleteNotification"
          ? "DELETE"
          : "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  };

  if (
    payload.method === "checkAccount" ||
    payload.method === "sendMessage"
  ) {
    init.body = JSON.stringify(payload.body ?? {});
  }

  try {
    const upstream = await fetch(url, init);
    const text = await upstream.text();

    if (!text) {
      return new NextResponse(null, { status: upstream.status || 204 });
    }

    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, { status: upstream.status });
    } catch {
      return NextResponse.json(
        { error: text || "Пустой ответ GREEN-API" },
        { status: upstream.status || 502 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось связаться с GREEN-API",
      },
      { status: 502 },
    );
  }
}
