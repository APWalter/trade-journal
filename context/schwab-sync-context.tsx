'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useData } from '@/context/data-provider'
import { toast } from 'sonner'
import { Synchronization } from '@/prisma/generated/prisma/browser'

interface SchwabSyncContextType {
  performSyncForAccount: (accountId: string) => Promise<{ success: boolean; message: string } | undefined>
  performSyncForAllAccounts: () => Promise<void>
  isAutoSyncing: boolean
  accounts: Synchronization[]
  loadAccounts: () => Promise<void>
  deleteAccount: (accountId: string) => Promise<void>
  syncInterval: number
  setSyncInterval: (interval: number) => void
  enableAutoSync: boolean
  setEnableAutoSync: (enabled: boolean) => void
}

const SchwabSyncContext = createContext<SchwabSyncContextType | undefined>(undefined)

export function SchwabSyncContextProvider({ children }: { children: ReactNode }) {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false)
  const [accounts, setAccounts] = useState<Synchronization[]>([])
  const [syncInterval, setSyncInterval] = useState(15) // 15 minutes default
  const [enableAutoSync, setEnableAutoSync] = useState(false)

  const { refreshTradesOnly } = useData()

  const normalizeSynchronization = useCallback(
    (sync: any): Synchronization => ({
      ...sync,
      lastSyncedAt: sync?.lastSyncedAt ? new Date(sync.lastSyncedAt) : null,
      tokenExpiresAt: sync?.tokenExpiresAt ? new Date(sync.tokenExpiresAt) : null,
      dailySyncTime: sync?.dailySyncTime ? new Date(sync.dailySyncTime) : null,
      createdAt: sync?.createdAt ? new Date(sync.createdAt) : new Date(),
      updatedAt: sync?.updatedAt ? new Date(sync.updatedAt) : new Date(),
    }),
    []
  )

  const loadAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/schwab/synchronizations", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch Schwab synchronizations")
      }

      const result = await response.json()
      const data = Array.isArray(result.data) ? result.data : []
      setAccounts(data.map(normalizeSynchronization))
    } catch (error) {
      console.warn('Failed to load Schwab accounts:', error)
    }
  }, [normalizeSynchronization])

  const deleteAccount = useCallback(async (accountId: string) => {
    setAccounts(prev => prev.filter(acc => acc.accountId !== accountId))
    await fetch("/api/schwab/synchronizations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId })
    })
  }, [])

  const performSyncForAccount = useCallback(async (accountId: string) => {
    try {
      const runSync = async () => {
        const response = await fetch("/api/schwab/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId })
        })

        const payload = await response.json()

        if (payload?.message === "DUPLICATE_TRADES") {
          return "All trades already imported"
        }

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || `Sync error for account ${accountId}`)
        }

        const savedCount = payload.savedCount || 0
        const ordersCount = payload.ordersCount || 0

        await loadAccounts()
        await refreshTradesOnly({ force: false })

        if (savedCount > 0) {
          return `Synced ${savedCount} new trades from ${ordersCount} orders (${accountId})`
        } else if (ordersCount > 0) {
          return `Processed ${ordersCount} orders, no new trades (${accountId})`
        }
        return `No orders found for ${accountId}`
      }

      const promise = runSync()
      toast.promise(promise, {
        loading: `Syncing Schwab account ${accountId}...`,
        success: (msg: string) => msg,
        error: (e) => `Sync failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      })
      const message = await promise
      return { success: true, message }
    } catch (error) {
      const errorMsg = `Sync error for ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Schwab sync error:', error)
      return { success: false, message: errorMsg }
    }
  }, [refreshTradesOnly, loadAccounts])

  const performSyncForAllAccounts = useCallback(async () => {
    if (isAutoSyncing) return

    setIsAutoSyncing(true)
    try {
      const validAccounts = accounts.filter(acc => acc.token)
      if (validAccounts.length === 0) return

      for (const account of validAccounts) {
        await performSyncForAccount(account.accountId)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('Error during Schwab bulk sync:', error)
    } finally {
      setIsAutoSyncing(false)
    }
  }, [isAutoSyncing, accounts, performSyncForAccount])

  const checkAndPerformSyncs = useCallback(async () => {
    if (!enableAutoSync || isAutoSyncing) return

    try {
      const now = Date.now()
      for (const account of accounts) {
        if (!account.token) continue
        const lastSyncTime = new Date(account.lastSyncedAt).getTime()
        const minutesSinceLastSync = (now - lastSyncTime) / (1000 * 60)
        if (minutesSinceLastSync >= syncInterval) {
          await performSyncForAccount(account.accountId)
        }
      }
    } catch (error) {
      console.warn('Error during Schwab auto-sync check:', error)
    }
  }, [enableAutoSync, isAutoSyncing, accounts, syncInterval, performSyncForAccount])

  useEffect(() => {
    if (!enableAutoSync) return
    const intervalId = setInterval(checkAndPerformSyncs, 60 * 1000)
    return () => clearInterval(intervalId)
  }, [enableAutoSync])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  return (
    <SchwabSyncContext.Provider value={{
      performSyncForAccount,
      performSyncForAllAccounts,
      isAutoSyncing,
      accounts,
      loadAccounts,
      deleteAccount,
      syncInterval,
      setSyncInterval,
      enableAutoSync,
      setEnableAutoSync,
    }}>
      {children}
    </SchwabSyncContext.Provider>
  )
}

export function useSchwabSyncContext() {
  const context = useContext(SchwabSyncContext)
  if (context === undefined) {
    throw new Error('useSchwabSyncContext must be used within a SchwabSyncContextProvider')
  }
  return context
}
