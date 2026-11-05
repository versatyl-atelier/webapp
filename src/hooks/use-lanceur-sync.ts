"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  LANCEUR_CHANNEL_NAME,
  LANCEUR_POLL_INTERVAL_MS,
} from "@/constants/lanceur";

export function notifyLanceurChange() {
  const channel = new BroadcastChannel(LANCEUR_CHANNEL_NAME);
  channel.postMessage(Date.now());
  channel.close();
}

export function useLanceurSync() {
  const router = useRouter();

  useEffect(() => {
    const channel = new BroadcastChannel(LANCEUR_CHANNEL_NAME);
    channel.onmessage = () => router.refresh();
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, LANCEUR_POLL_INTERVAL_MS);
    return () => {
      channel.close();
      clearInterval(poll);
    };
  }, [router]);
}
