import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface ResponsiveCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "compact" | "interactive";
  onClick?: () => void;
}

const ResponsiveCard = React.forwardRef<HTMLDivElement, ResponsiveCardProps>(
  ({ className, variant = "default", onClick, children, ...props }, ref) => {
    const isInteractive = variant === "interactive" || !!onClick;
    
    return (
      <Card
        ref={ref}
        className={cn(
          "card-mobile-friendly",
          variant === "compact" && "p-3",
          isInteractive && [
            "card-hover touch-feedback",
            "cursor-pointer transition-all duration-200"
          ],
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

ResponsiveCard.displayName = "ResponsiveCard";

// Variantes responsivas dos componentes de cartão

const ResponsiveCardHeader = React.forwardRef<
  React.ElementRef<typeof CardHeader>,
  React.ComponentPropsWithoutRef<typeof CardHeader>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn("p-3 sm:p-4 md:p-5", className)}
    {...props}
  />
));

ResponsiveCardHeader.displayName = "ResponsiveCardHeader";

const ResponsiveCardTitle = React.forwardRef<
  React.ElementRef<typeof CardTitle>,
  React.ComponentPropsWithoutRef<typeof CardTitle>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn("text-responsive break-words", className)}
    {...props}
  />
));

ResponsiveCardTitle.displayName = "ResponsiveCardTitle";

const ResponsiveCardDescription = React.forwardRef<
  React.ElementRef<typeof CardDescription>,
  React.ComponentPropsWithoutRef<typeof CardDescription>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn("text-sm sm:text-base break-words", className)}
    {...props}
  />
));

ResponsiveCardDescription.displayName = "ResponsiveCardDescription";

const ResponsiveCardContent = React.forwardRef<
  React.ElementRef<typeof CardContent>,
  React.ComponentPropsWithoutRef<typeof CardContent>
>(({ className, ...props }, ref) => (
  <CardContent
    ref={ref}
    className={cn("p-3 sm:p-4 md:p-5 pt-0", className)}
    {...props}
  />
));

ResponsiveCardContent.displayName = "ResponsiveCardContent";

const ResponsiveCardFooter = React.forwardRef<
  React.ElementRef<typeof CardFooter>,
  React.ComponentPropsWithoutRef<typeof CardFooter>
>(({ className, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn("p-3 sm:p-4 md:p-5 pt-0 flex flex-wrap gap-2", className)}
    {...props}
  />
));

ResponsiveCardFooter.displayName = "ResponsiveCardFooter";

export {
  ResponsiveCard,
  ResponsiveCardHeader,
  ResponsiveCardTitle,
  ResponsiveCardDescription,
  ResponsiveCardContent,
  ResponsiveCardFooter
}; 