import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  User, 
  LogOut, 
  FileText, 
  Calendar,
  Package, 
  History,
  Target,
  BarChart3,
  CheckSquare,
  Clipboard,
  PieChart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const More = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Metas & Evolução",
      description: "Acompanhe o progresso de metas individuais",
      path: "/metas-evolucao"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Desempenho Detalhado",
      description: "Estatísticas e análises avançadas",
      path: "/desempenho-detalhado"
    },
    {
      icon: <Clipboard className="h-5 w-5" />,
      title: "Atas de Reunião",
      description: "Registro e consulta de atas de reunião",
      path: "/atas-reuniao"
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      title: "Dashboard de Atas",
      description: "Estatísticas e análises de reuniões",
      path: "/atas-reuniao/dashboard"
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      title: "Gestão de Presença",
      description: "Controle de presença em treinos",
      path: "/presencas"
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Histórico",
      description: "Histórico de atividades e alterações",
      path: "/historico"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Calendário",
      description: "Agenda de treinos e eventos",
      path: "/calendario"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      description: "Ajustes e preferências do sistema",
      path: "/configuracoes"
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      title: "Sair",
      description: "Encerrar sessão",
      action: () => signOut()
    }
  ];

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Mais Opções</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            className="p-4 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleItemClick(item)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg mr-4">
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: "h-6 w-6 text-primary"
                })}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default More;
