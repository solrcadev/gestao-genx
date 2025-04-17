
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  BarChart3,
  Users,
  MoreHorizontal,
  Target,
  Bell
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const BottomNavbar = () => {
  const location = useLocation();
  const { profile } = useProfile();
  const isCoach = profile?.role === "coach";

  const isActive = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-2 z-10">
      <div className="flex items-center justify-between gap-1">
        {isCoach ? (
          // Coach Navigation
          <>
            <Link
              to="/atletas"
              className={`flex flex-col items-center p-2 rounded-md transition-colors ${
                isActive("/atletas")
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <Users size={20} />
              <span className="text-xs">Atletas</span>
            </Link>

            <Link
              to="/treinos"
              className={`flex flex-col items-center p-2 rounded-md transition-colors ${
                isActive("/treinos")
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <Calendar size={20} />
              <span className="text-xs">Treinos</span>
            </Link>
          </>
        ) : null}

        {/* Shared Navigation Items */}
        <Link
          to="/metas-evolucao"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/metas-evolucao")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Target size={20} />
          <span className="text-xs">Metas</span>
        </Link>

        <Link
          to="/desempenho-detalhado"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/desempenho-detalhado")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <BarChart3 size={20} />
          <span className="text-xs">Desempenho</span>
        </Link>

        <Link
          to="/notification-settings"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/notification-settings")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Bell size={20} />
          <span className="text-xs">Notificações</span>
        </Link>

        <Link
          to="/more"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/more")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-xs">Mais</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavbar;
