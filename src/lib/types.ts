export type Credentials = {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
};

export type Chat = {
  chatId: string;
  phone: string;
  name: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: "incoming" | "outgoing";
  status?: "sending" | "sent" | "error";
};

export type GreenApiProxyRequest = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
  method:
    | "getStateInstance"
    | "checkAccount"
    | "sendMessage"
    | "receiveNotification"
    | "deleteNotification";
  body?: Record<string, unknown>;
  receiptId?: number;
  receiveTimeout?: number;
};
