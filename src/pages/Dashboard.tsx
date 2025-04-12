
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  LogOut,
  Plus
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: "Atletas",
      icon: <Users className="h-5 w-5" />,
      path: "/atletas",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Treinos",
      icon: <Calendar className="h-5 w-5" />,
      path: "/treinos",
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Exercícios",
      icon: <Dumbbell className="h-5 w-5" />,
      path: "/exercicios",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      title: "Desempenho",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/desempenho",
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <div className="mobile-container py-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Olá, {user?.email?.split('@')[0] || 'Técnico'}</h1>
          <p className="text-muted-foreground">Bem-vindo ao GEN X - Painel de Gestão</p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {quickLinks.map((link) => (
          <Card 
            key={link.title} 
            className="border cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(link.path)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
              <div className={`p-2 rounded-full ${link.color}`}>
                {link.icon}
              </div>
              <span className="text-sm font-medium">{link.title}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button 
            className="justify-start" 
            variant="outline"
            onClick={() => navigate("/montar-treino")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar novo treino
          </Button>
          <Button 
            className="justify-start" 
            variant="outline"
            onClick={() => navigate("/treino-do-dia")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Treino do dia
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Atividade recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <p>Nenhuma atividade recente para mostrar.</p>
            <p className="text-sm">Seus treinos e avaliações aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
