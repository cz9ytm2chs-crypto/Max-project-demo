"use client";

import { useEffect, useState } from "react";
import { ChatApp } from "@/components/ChatApp";
import { LoginScreen } from "@/components/LoginScreen";
import { loadCredentials, saveCredentials } from "@/lib/storage";
import type { Credentials } from "@/lib/types";

export default function HomePage() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCredentials(loadCredentials());
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="boot">Загрузка…</div>;
  }

  if (!credentials) {
    return (
      <LoginScreen
        onSuccess={(value) => {
          saveCredentials(value);
          setCredentials(value);
        }}
      />
    );
  }

  return (
    <ChatApp
      credentials={credentials}
      onLogout={() => setCredentials(null)}
    />
  );
}
