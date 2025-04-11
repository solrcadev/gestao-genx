
import { Users, Calendar, BarChart2, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNavbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    {
      label: "Atletas",
      icon: <Users className="bottom-nav-icon" />,
      path: "/",
      active: currentPath === "/"
    },
    {
      label: "Treinos",
      icon: <Calendar className="bottom-nav-icon" />,
      path: "/treinos",
      active: currentPath === "/treinos"
    },
    {
      label: "Desempenho",
      icon: <BarChart2 className="bottom-nav-icon" />,
      path: "/desempenho",
      active: currentPath === "/desempenho"
    },
    {
      label: "Mais",
      icon: <Menu className="bottom-nav-icon" />,
      path: "/mais",
      active: currentPath === "/mais"
    }
  ];
  
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`bottom-nav-item ${item.active ? "active" : ""}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNavbar;
