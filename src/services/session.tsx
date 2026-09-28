import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SessionUser } from "@/types/arena";

const KEY = "sera-session-v1";

interface SessionContextValue {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function load(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(load);
  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      signIn: (next) => {
        localStorage.setItem(KEY, JSON.stringify(next));
        setUser(next);
      },
      signOut: () => {
        localStorage.removeItem(KEY);
        setUser(null);
      },
    }),
    [user],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
