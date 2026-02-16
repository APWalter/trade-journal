'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useUserStore } from '@/store/user-store'
import ImportButton from '../app/[locale]/dashboard/components/import/import-button'
import { useI18n } from "@/locales/client"
import OnboardingModal from './onboarding-modal'
import { AccountGroupBoard } from '@/app/[locale]/dashboard/components/filters/account-group-board'
import { useModalStateStore } from '@/store/modal-state-store'
import { useTradesStore } from '@/store/trades-store'
import { toast } from 'sonner'

export default function Modals() {
  const user = useUserStore((state) => state.user)
  const isLoading = useUserStore((state) => state.isLoading)
  const trades = useTradesStore((state) => state.trades)
  const [isTradesDialogOpen, setIsTradesDialogOpen] = useState(false)
  const t = useI18n()
  const { accountGroupBoardOpen, setAccountGroupBoardOpen } = useModalStateStore()

  useEffect(() => {
    if (!isLoading) {
      if (!trades) {
        console.warn('No trades available. Please add some trades to see the dashboard content.');
        // Use requestAnimationFrame to defer state update
        requestAnimationFrame(() => {
          setIsTradesDialogOpen(true)
        })
      }
    }
  }, [trades, isLoading])

  // Handle loading toast
  const loadingToastRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (isLoading && !loadingToastRef.current) {
      // Show loading toast
      const toastId = toast.loading(t('loading.trades'))
      loadingToastRef.current = toastId
    } else if (!isLoading && loadingToastRef.current) {
      // Dismiss loading toast
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
    }
  }, [isLoading, t])

  const handleOnboardingDismiss = useCallback(() => {
    // Open import trades dialog if user has no trades
    // Use a slightly longer delay to ensure onboarding state has updated
    setTimeout(() => {
      // Check current trades state - trades is initialized as empty array []
      const currentTrades = useTradesStore.getState().trades
      const currentIsLoading = useUserStore.getState().isLoading
      const hasNoTrades = !currentTrades || currentTrades.length === 0

      console.log('Onboarding dismissed - checking trades:', {
        tradesCount: currentTrades?.length || 0,
        isLoading: currentIsLoading,
        willOpen: hasNoTrades && !currentIsLoading
      })

      if (hasNoTrades && !currentIsLoading) {
        setIsTradesDialogOpen(true)
      }
    }, 300)
  }, [])

  if (!user) return null
  return (
    <>
      <OnboardingModal onDismiss={handleOnboardingDismiss} />

      {/* Tooltip Portal for Sheet */}
      <div id="sheet-tooltip-portal" className="fixed inset-0 pointer-events-none z-100" />

      {/* Account Group Board */}
      <Sheet open={accountGroupBoardOpen} onOpenChange={setAccountGroupBoardOpen}>
        <SheetContent side="right" className="w-[90vw] sm:w-[800px] sm:max-w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('filters.manageAccounts')}</SheetTitle>
            <SheetDescription>
              {t('filters.manageAccountsDescription')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AccountGroupBoard/>
          </div>
        </SheetContent>
      </Sheet>

      {/* Show import trades dialog if no trades */}
      <Dialog open={isTradesDialogOpen} onOpenChange={setIsTradesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modals.noTrades.title')}</DialogTitle>
            <DialogDescription>
              {t('modals.noTrades.description')}
            </DialogDescription>
          </DialogHeader>
          <ImportButton />
        </DialogContent>
      </Dialog>
    </>
  )
}
