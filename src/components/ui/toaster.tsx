// @ts-nocheck
import React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  try {
    const { toasts } = useToast()

    if (!toasts || !Array.isArray(toasts)) {
      // Fallback quando toasts não é válido
      return (
        <ToastProvider>
          <ToastViewport />
        </ToastProvider>
      )
    }

    return (
      <ToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
        <ToastViewport />
      </ToastProvider>
    )
  } catch (error) {
    console.error("Toaster component error:", error)
    // Retornar um componente vazio em caso de erro
    return null
  }
}
