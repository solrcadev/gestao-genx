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
  PieChart,
  Award,
  Users,
  Database
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const More = () => {
  const navigate = useNavigate();
  const { userRole, signOut } = useAuth();
  
  // Verificar se é técnico
  const isTecnico = userRole === 'tecnico';

  // Itens de menu específicos para técnicos
  const tecnicoItems = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "Gerenciar Monitores",
      description: "Cadastrar e gerenciar acesso de monitores",
      path: "/monitor-management"
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "Migração do Banco",
      description: "Atualizar estrutura do banco de dados",
      path: "/admin/migracao-db"
    }
  ];

  // Todos os itens de menu
  const allMenuItems = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Metas & Evolução",
      description: "Acompanhe o progresso de metas individuais",
      path: "/metas-evolucao",
      showFor: ['tecnico', 'monitor'] // Visível para ambos, mas será read-only para monitor
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Avaliação Qualitativa",
      description: "Registre eventos com peso técnico por fundamento",
      path: "/avaliacao-qualitativa",
      showFor: ['tecnico', 'monitor'] // Visível para ambos, com permissões de registro
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Desempenho Detalhado",
      description: "Estatísticas e análises avançadas",
      path: "/desempenho-detalhado",
      showFor: ['tecnico', 'monitor'] // Visível para ambos, mas será read-only para monitor
    },
    {
      icon: <Clipboard className="h-5 w-5" />,
      title: "Atas de Reunião",
      description: "Registro e consulta de atas de reunião",
      path: "/atas-reuniao",
      showFor: ['tecnico', 'monitor'] // Visível para ambos, mas será read-only para monitor
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      title: "Dashboard de Atas",
      description: "Estatísticas e análises de reuniões",
      path: "/atas-reuniao/dashboard",
      showFor: ['tecnico', 'monitor'] // Visível para ambos, mas será read-only para monitor
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      title: "Gestão de Presença",
      description: "Controle de presença em treinos",
      path: "/presencas",
      showFor: ['tecnico', 'monitor'] // Visível para ambos, com permissões de registro
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Histórico",
      description: "Histórico de atividades e alterações",
      path: "/historico",
      showFor: ['tecnico'] // Visível apenas para técnicos
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Calendário",
      description: "Agenda de treinos e eventos",
      path: "/calendario",
      showFor: ['tecnico', 'monitor'] // Visível para ambos
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      description: "Ajustes e preferências do sistema",
      path: "/configuracoes",
      showFor: ['tecnico'] // Visível apenas para técnicos
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      title: "Sair",
      description: "Encerrar sessão",
      action: () => signOut(),
      showFor: ['tecnico', 'monitor'] // Visível para ambos
    }
  ];

  // Filtrar os itens de menu com base no papel do usuário
  const filteredMenuItems = allMenuItems.filter(item => 
    !item.showFor || item.showFor.includes(userRole || '')
  );

  // Combinar os itens de menu, adicionando os específicos para técnicos no início
  const menuItemsToShow = isTecnico ? [...tecnicoItems, ...filteredMenuItems] : filteredMenuItems;

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
        {menuItemsToShow.map((item, index) => (
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
