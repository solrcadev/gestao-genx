import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact" | "separated";
  gap?: "small" | "medium" | "large";
}

const ResponsiveList = React.forwardRef<HTMLDivElement, ResponsiveListProps>(
  ({ className, variant = "default", gap = "medium", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mobile-list",
          variant === "separated" && "divide-y-0",
          variant === "compact" && "space-y-1 sm:space-y-2",
          gap === "small" && "space-y-1 sm:space-y-2",
          gap === "large" && "space-y-3 sm:space-y-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveList.displayName = "ResponsiveList";

interface ResponsiveListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "card";
  interactive?: boolean;
  active?: boolean;
}

const ResponsiveListItem = React.forwardRef<HTMLDivElement, ResponsiveListItemProps>(
  ({ className, variant = "default", interactive = false, active = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "py-2 px-3 sm:py-3 sm:px-4 rounded-lg overflow-hidden",
          variant === "bordered" && "border border-border",
          variant === "card" && "border border-border bg-card shadow-sm",
          interactive && [
            "cursor-pointer transition-colors duration-200",
            "hover:bg-accent/50 active:bg-accent/70 active:scale-[0.98]"
          ],
          active && "bg-accent/30",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveListItem.displayName = "ResponsiveListItem";

export { ResponsiveList, ResponsiveListItem }; 