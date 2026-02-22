"use client";

import { createContext, useContext, useMemo, useCallback, ReactNode } from "react";
import {
  SchwabSyncContextProvider,
  useSchwabSyncContext,
} from "@/context/schwab-sync-context";

interface ManualSyncResult {
  success: boolean;
  message: string;
}

interface SyncContextValue {
  schwab: ReturnType<typeof useSchwabSyncContext>;
  manualSync: (accountId: string) => Promise<ManualSyncResult | undefined>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

function SyncContextBridge({ children }: { children: ReactNode }) {
  const schwab = useSchwabSyncContext();

  const manualSync = useCallback<SyncContextValue["manualSync"]>(
    async (accountId) => {
      const result = await schwab.performSyncForAccount(accountId);
      if (!result) return;

      return {
        success: result.success,
        message: result.message,
      };
    },
    [schwab]
  );

  const value = useMemo(
    () => ({
      schwab,
      manualSync,
    }),
    [manualSync, schwab]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function SyncContextProvider({ children }: { children: ReactNode }) {
  return (
    <SchwabSyncContextProvider>
      <SyncContextBridge>{children}</SyncContextBridge>
    </SchwabSyncContextProvider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within a SyncContextProvider");
  }
  return context;
}
