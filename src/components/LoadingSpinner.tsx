import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Transition } from "./ui/transition";

interface LoadingSpinnerProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  message?: string;
  fullPage?: boolean;
  delay?: number;
}

const LoadingSpinner = ({ 
  className, 
  showText = true, 
  size = "md", 
  message = "Carregando...",
  fullPage = false,
  delay = 0
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10"
  };

  const containerClasses = fullPage 
    ? "fixed inset-0 flex items-center justify-center bg-background/80 z-50" 
    : "flex flex-col items-center justify-center py-6";

  return (
    <Transition type="fade" delay={delay} className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center justify-center">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {showText && <p className={cn("mt-3 text-muted-foreground", {
          "text-xs": size === "sm",
          "text-sm": size === "md",
          "text-base": size === "lg"
        })}>{message}</p>}
      </div>
    </Transition>
  );
};

export default LoadingSpinner;
