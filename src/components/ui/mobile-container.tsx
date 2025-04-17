import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  fullHeight?: boolean;
  bottomNav?: boolean;
}

const MobileContainer = React.forwardRef<HTMLDivElement, MobileContainerProps>(
  ({ className, children, noPadding = false, fullHeight = false, bottomNav = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto max-w-md w-full",
          noPadding ? "" : "px-4 sm:px-6",
          fullHeight ? "min-h-[calc(100vh-60px)]" : "",
          bottomNav ? "pb-[76px] sm:pb-[84px]" : "pb-6",
          "pt-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MobileContainer.displayName = "MobileContainer";

export { MobileContainer }; 