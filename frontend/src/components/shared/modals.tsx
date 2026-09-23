import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";

/* ─── Modal ─────────────────────────────────────────────────── */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Full-screen on mobile by default */
  fullScreenMobile?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  fullScreenMobile = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          "relative bg-white shadow-xl z-10",
          fullScreenMobile
            ? "inset-0 fixed md:static md:inset-auto md:rounded-2xl md:max-w-lg md:w-full md:max-h-[85vh]"
            : "rounded-2xl max-w-lg w-full mx-4 max-h-[85vh]",
          "overflow-y-auto",
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-neutral-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn(!title && "pt-6", "px-6 pb-6")}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Confirm Modal ─────────────────────────────────────────── */

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} fullScreenMobile={false}>
      <div className="text-center">
        <div
          className={cn(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4",
            variant === "danger" ? "bg-danger-50" : "bg-primary-50",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-6 w-6",
              variant === "danger" ? "text-danger-500" : "text-primary-500",
            )}
          />
        </div>
        <h3 className="font-display text-lg font-semibold text-neutral-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-neutral-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
