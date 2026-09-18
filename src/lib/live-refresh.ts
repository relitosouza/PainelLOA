"use client";

import { useEffect, useRef } from "react";

// Canal entre abas do mesmo navegador: a Análise LOA avisa quando salva, e as telas que dependem dela recarregam na hora.
const CHANNEL = "painel-loa-dados";

export function notifyAnaliseLoaSaved() {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ tipo: "analise-loa-salva", em: Date.now() });
    channel.close();
  } catch {
    // Navegador sem BroadcastChannel: a atualização periódica cobre o caso.
  }
}

/**
 * Recarrega os dados de uma tela: a cada `intervalMs` enquanto a aba está visível, quando a aba volta ao foco
 * e imediatamente quando a Análise LOA salva em outra aba do mesmo navegador.
 */
export function useLiveRefresh(refresh: () => void, intervalMs = 15_000) {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") refreshRef.current();
    };
    const timer = window.setInterval(run, intervalMs);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = () => refreshRef.current();
    } catch {
      channel = null;
    }

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
      channel?.close();
    };
  }, [intervalMs]);
}
