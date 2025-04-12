import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TransitionProps {
  children: ReactNode;
  className?: string;
  type?: "fade" | "slide" | "scale" | "none";
  duration?: number;
  delay?: number;
}

export function Transition({
  children,
  className,
  type = "fade",
  duration = 0.3,
  delay = 0
}: TransitionProps) {
  // Define variantes para diferentes tipos de animação
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 }
    },
    none: {
      hidden: {},
      visible: {}
    }
  };

  if (type === "none") {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[type]}
      transition={{ duration, delay, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}

// Componente para transição de lista
export function TransitionList({
  children,
  className,
  staggerChildren = 0.05,
  type = "fade",
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  staggerChildren?: number;
  type?: "fade" | "slide" | "scale";
  delay?: number;
}) {
  const variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: delay
      }
    }
  };

  const childVariants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slide: {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.98 },
      visible: { opacity: 1, scale: 1 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={cn("w-full", className)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        return (
          <motion.div variants={childVariants[type]} transition={{ duration: 0.2 }}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
} 