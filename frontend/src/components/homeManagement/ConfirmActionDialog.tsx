import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void

  onConfirm: () => Promise<void>

  title: string
  description: React.ReactNode

  confirmText?: string
  cancelText?: string

  successMessage?: string
  errorMessage?: string

  testId?: string
}

export const ConfirmActionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  successMessage,
  errorMessage = 'Something went wrong',
  testId,
}) => {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)

    try {
      await onConfirm()

      if (successMessage) {
        toast.success(successMessage)
      }

      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : errorMessage
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-border bg-background text-foreground sm:max-w-md"
        data-testid={testId}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">
            {title}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground"
          >
            {cancelText}
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={busy}
            className="bg-destructive text-foreground hover:bg-red-600"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}