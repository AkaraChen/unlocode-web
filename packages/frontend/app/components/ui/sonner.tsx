import type { ToasterProps } from "sonner";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border border-border/60 bg-card/90 text-foreground shadow-lg",
          title: "text-sm font-semibold",
          description: "text-xs text-muted-foreground",
          actionButton:
            "rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-medium",
        },
      }}
      {...props}
    />
  );
}
