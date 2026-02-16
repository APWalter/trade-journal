'use client'

import { useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useData } from '@/context/data-provider'
import { useI18n } from '@/locales/client'
import { useUserStore } from '@/store/user-store'

interface OnboardingModalProps {
  onDismiss?: () => void
}

export default function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const { isFirstConnection, changeIsFirstConnection } = useData()
  const t = useI18n()

  const videoId = process.env.NEXT_PUBLIC_ONBOARDING_VIDEO_ID_EN || process.env.NEXT_PUBLIC_ONBOARDING_VIDEO_ID

  const handleClose = useCallback(async () => {
    try {
      changeIsFirstConnection(false)
      setTimeout(() => {
        onDismiss?.()
      }, 100)
    } catch (error) {
      console.error('Failed to update onboarding status:', error)
    }
  }, [changeIsFirstConnection, onDismiss])

  return (
    <Dialog open={isFirstConnection} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-[800px] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t('onboarding.welcome')}
          </DialogTitle>
          <DialogDescription>
            {t('onboarding.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mt-6">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Welcome Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleClose}>
            {t('onboarding.getStarted')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
