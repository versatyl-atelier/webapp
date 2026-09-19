"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
} from "react";

type AuthSuccessListener = () => void;

interface AuthEventsContextType {
  emitAuthSuccess: () => void;
  subscribeAuthSuccess: (listener: AuthSuccessListener) => () => void;
}

const AuthEventsContext = createContext<AuthEventsContextType | null>(null);

export function AuthEventsProvider({ children }: PropsWithChildren) {
  const listenersRef = useRef(new Set<AuthSuccessListener>());

  const emitAuthSuccess = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const subscribeAuthSuccess = useCallback((listener: AuthSuccessListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return (
    <AuthEventsContext.Provider
      value={{ emitAuthSuccess, subscribeAuthSuccess }}
    >
      {children}
    </AuthEventsContext.Provider>
  );
}

export function useAuthEvents() {
  const context = useContext(AuthEventsContext);
  if (!context) {
    throw new Error(
      "`useAuthEvents` must be used within an AuthEventsProvider",
    );
  }
  return context;
}
