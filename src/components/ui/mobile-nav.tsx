import * as React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: NavItem[];
}

const MobileNav = React.forwardRef<HTMLDivElement, MobileNavProps>(
  ({ className, items, ...props }, ref) => {
    const location = useLocation();
    
    return (
      <div 
        ref={ref}
        className={cn(
          "mobile-bottom-nav",
          className
        )}
        {...props}
      >
        {items.map((item, index) => {
          const isActive = location.pathname === item.href || 
                           (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "mobile-bottom-nav-button",
                isActive ? "text-primary" : "text-muted-foreground",
                "transition-colors"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="h-5 w-5 mb-1">{item.icon}</div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }
);

MobileNav.displayName = "MobileNav";

export { MobileNav, type NavItem }; 