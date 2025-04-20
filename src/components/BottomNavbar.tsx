
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  BarChart3,
  Dumbbell,
  Users,
  MoreHorizontal,
  Clipboard,
  Home,
  Dices,
  Target
} from "lucide-react";

const BottomNavbar = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    // Verifica se o pathname atual começa com o path especificado
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-2 z-10">
      <div className="flex items-center justify-between gap-1">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/dashboard")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Home size={20} />
          <span className="text-xs">Início</span>
        </Link>

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
            isActive("/treinos") || isActive("/montar-treino") || isActive("/montagem-treino") || isActive("/treino-do-dia") || isActive("/presencas")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Dumbbell size={20} />
          <span className="text-xs">Treinos</span>
        </Link>

        <Link
          to="/exercicios"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/exercicios")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Dices size={20} />
          <span className="text-xs">Exercícios</span>
        </Link>

        <Link
          to="/desempenho"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/desempenho")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <BarChart3 size={20} />
          <span className="text-xs">Desempenho</span>
        </Link>

        <Link
          to="/metas"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/metas")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Target size={20} />
          <span className="text-xs">Metas</span>
        </Link>

        <Link
          to="/mais"
          className={`flex flex-col items-center p-2 rounded-md transition-colors ${
            isActive("/mais")
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
