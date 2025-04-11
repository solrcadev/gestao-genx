
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Calendar, Activity, Dumbbell, MoreHorizontal } from "lucide-react";

const BottomNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path: string) => {
    return pathname === path ? "active" : "";
  };

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isActive("/")}`}>
        <Users className="bottom-nav-icon" />
        <span>Atletas</span>
      </Link>
      <Link to="/treinos" className={`bottom-nav-item ${isActive("/treinos")}`}>
        <Calendar className="bottom-nav-icon" />
        <span>Treinos</span>
      </Link>
      <Link to="/exercicios" className={`bottom-nav-item ${isActive("/exercicios")}`}>
        <Dumbbell className="bottom-nav-icon" />
        <span>Exercícios</span>
      </Link>
      <Link to="/desempenho" className={`bottom-nav-item ${isActive("/desempenho")}`}>
        <Activity className="bottom-nav-icon" />
        <span>Desempenho</span>
      </Link>
      <Link to="/mais" className={`bottom-nav-item ${isActive("/mais")}`}>
        <MoreHorizontal className="bottom-nav-icon" />
        <span>Mais</span>
      </Link>
    </nav>
  );
};

export default BottomNavbar;
