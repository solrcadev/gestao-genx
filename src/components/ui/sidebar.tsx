
import React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home,
  LayoutDashboard,
  Calendar,
  ListChecks,
  Users,
  Settings,
} from 'lucide-react';
import { useConsolidatedAuth } from '@/hooks/useConsolidatedAuth';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar() {
  const location = useLocation();
  const { profile, isTecnico } = useConsolidatedAuth();

  return (
    <div className="flex h-full max-w-[280px] flex-col border-r bg-secondary/50 py-4">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/"
              className={cn(
                "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/" ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Treinos
          </h2>
          <div className="space-y-1">
            <Link
              to="/treino-do-dia"
              className={cn(
                "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/treino-do-dia" ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Treino do dia</span>
            </Link>
            <Link
              to="/lista-de-exercicios"
              className={cn(
                "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/lista-de-exercicios" ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              <span>Lista de exercícios</span>
            </Link>
          </div>
        </div>
        
        {isTecnico && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Administração
            </h2>
            <div className="space-y-1">
              <Link
                to="/monitor-management"
                className={cn(
                  "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location.pathname === "/monitor-management" ? "bg-accent text-accent-foreground" : "transparent"
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Gerenciar Monitores</span>
              </Link>
              <Link
                to="/evaluation-management"
                className={cn(
                  "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  location.pathname === "/evaluation-management" ? "bg-accent text-accent-foreground" : "transparent"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Aprovar Avaliações</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
