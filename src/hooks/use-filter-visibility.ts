"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface FilterFieldOption {
  key: string;
  label: string;
  category?: string;
  description?: string;
}

interface UseFilterVisibilityOptions {
  storageKey: string;
  dbKey: string;
  availableKeys: string[];
  defaultVisibleKeys?: string[];
}

export function useFilterVisibility({
  storageKey,
  dbKey,
  availableKeys,
  defaultVisibleKeys,
}: UseFilterVisibilityOptions) {
  const initialDefault = defaultVisibleKeys || availableKeys;
  const availableKeysRef = useRef(availableKeys);
  availableKeysRef.current = availableKeys;

  // Estado inicial a partir do localStorage para hidratação imediata
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((k) => availableKeys.includes(k));
          }
        }
      } catch (err) {
        console.warn("Erro ao ler visibilidade dos filtros do localStorage:", err);
      }
    }
    return initialDefault;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const hasLoadedDbRef = useRef<string | null>(null);

  // 1. Carregar preferências do Banco de Dados apenas UMA vez por dbKey
  useEffect(() => {
    if (hasLoadedDbRef.current === dbKey) {
      return;
    }
    hasLoadedDbRef.current = dbKey;

    let isMounted = true;

    async function loadFromDb() {
      try {
        const res = await fetch(`/api/configuracoes/layout?chave=${encodeURIComponent(dbKey)}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (isMounted && data?.success && Array.isArray(data.valor) && data.valor.length > 0) {
          const currentAvail = availableKeysRef.current;
          const validKeys = data.valor.filter((k: string) => currentAvail.includes(k));
          if (validKeys.length > 0) {
            setVisibleKeys((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(validKeys)) return prev;
              return validKeys;
            });
            if (typeof window !== "undefined") {
              localStorage.setItem(storageKey, JSON.stringify(validKeys));
            }
          }
        }
      } catch (err) {
        console.warn("Aviso ao carregar filtros do banco de dados:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFromDb();

    return () => {
      isMounted = false;
    };
  }, [dbKey, storageKey]);

  // 2. Função de persistência no Banco de Dados e LocalStorage
  const persistVisibility = useCallback(
    async (newKeys: string[]) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newKeys));
        } catch (e) {
          console.warn("Erro ao salvar filtros no localStorage:", e);
        }
      }

      setIsSaving(true);
      try {
        await fetch("/api/configuracoes/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chave: dbKey,
            valor: newKeys,
          }),
        });
        setLastSavedAt(new Date());
      } catch (err) {
        console.error("Erro ao salvar visibilidade dos filtros no banco:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [dbKey, storageKey]
  );

  // 3. Mutadores de estado
  const toggleField = useCallback(
    (fieldKey: string) => {
      setVisibleKeys((prev) => {
        let updated: string[];
        if (prev.includes(fieldKey)) {
          if (prev.length <= 1) return prev;
          updated = prev.filter((k) => k !== fieldKey);
        } else {
          const currentAvail = availableKeysRef.current;
          updated = currentAvail.filter((k) => prev.includes(k) || k === fieldKey);
        }
        persistVisibility(updated);
        return updated;
      });
    },
    [persistVisibility]
  );

  const hideField = useCallback(
    (fieldKey: string) => {
      setVisibleKeys((prev) => {
        if (!prev.includes(fieldKey) || prev.length <= 1) return prev;
        const updated = prev.filter((k) => k !== fieldKey);
        persistVisibility(updated);
        return updated;
      });
    },
    [persistVisibility]
  );

  const showField = useCallback(
    (fieldKey: string) => {
      setVisibleKeys((prev) => {
        if (prev.includes(fieldKey)) return prev;
        const currentAvail = availableKeysRef.current;
        const updated = currentAvail.filter((k) => prev.includes(k) || k === fieldKey);
        persistVisibility(updated);
        return updated;
      });
    },
    [persistVisibility]
  );

  const showAll = useCallback(() => {
    const updated = [...availableKeysRef.current];
    setVisibleKeys(updated);
    persistVisibility(updated);
  }, [persistVisibility]);

  const resetToDefault = useCallback(() => {
    const updated = [...(defaultVisibleKeys || availableKeysRef.current)];
    setVisibleKeys(updated);
    persistVisibility(updated);
  }, [defaultVisibleKeys, persistVisibility]);

  const isVisible = useCallback(
    (fieldKey: string) => visibleKeys.includes(fieldKey),
    [visibleKeys]
  );

  return {
    visibleKeys,
    isLoading,
    isSaving,
    lastSavedAt,
    toggleField,
    hideField,
    showField,
    showAll,
    resetToDefault,
    isVisible,
  };
}
