
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Calendar, Activity, Home, Grid2x2, ClipboardCheck, CheckSquare } from "lucide-react";

const BottomNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path: string) => {
    return pathname === path ? "active" : "";
  };

  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" className={`bottom-nav-item ${isActive("/dashboard")}`}>
        <Home className="bottom-nav-icon" />
        <span>Início</span>
      </Link>
      <Link to="/atletas" className={`bottom-nav-item ${isActive("/atletas")}`}>
        <Users className="bottom-nav-icon" />
        <span>Atletas</span>
      </Link>
      <Link to="/treinos" className={`bottom-nav-item ${isActive("/treinos")}`}>
        <Calendar className="bottom-nav-icon" />
        <span>Treinos</span>
      </Link>
      <Link to="/treino-do-dia" className={`bottom-nav-item ${isActive("/treino-do-dia")}`}>
        <ClipboardCheck className="bottom-nav-icon" />
        <span>Treino do Dia</span>
      </Link>
      <Link to="/presencas" className={`bottom-nav-item ${isActive("/presencas")}`}>
        <CheckSquare className="bottom-nav-icon" />
        <span>Presenças</span>
      </Link>
      <Link to="/exercicios" className={`bottom-nav-item ${isActive("/exercicios")}`}>
        <Grid2x2 className="bottom-nav-icon" />
        <span>Exercícios</span>
      </Link>
      <Link to="/desempenho" className={`bottom-nav-item ${isActive("/desempenho")}`}>
        <Activity className="bottom-nav-icon" />
        <span>Desempenho</span>
      </Link>
    </nav>
  );
};

export default BottomNavbar;
