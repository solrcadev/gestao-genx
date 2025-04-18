// @ts-nocheck
import React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  try {
    // Fallback caso useTheme falhe
    let theme = "system"
    try {
      const themeContext = useTheme()
      theme = themeContext?.theme || "system"
    } catch (e) {
      console.warn("Theme context failed, using system theme", e)
    }

    return (
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          },
        }}
        {...props}
      />
    )
  } catch (error) {
    console.error("Sonner Toaster error:", error)
    // Retornar null em caso de erro para evitar crash
    return null
  }
}

export { Toaster }
