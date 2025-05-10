import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { syncLocalStorageWithDatabase } from "@/services/syncService";
import { 
  getRoute, 
  ATTEMPTED_ROUTE_KEY, 
  ROUTE_STORAGE_KEY 
} from "@/utils/route-persistence";

// Esquema de validação do formulário
const formSchema = z.object({
  email: z.string().email({ message: "Digite um email válido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type FormValues = z.infer<typeof formSchema>;

const LoginPage: React.FC = () => {
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, user, isLoading: isAuthLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Função para recuperar a rota de redirecionamento após login
  const getRedirectRoute = (): string => {
    // Primeiro verificar se há uma rota tentada (quando o usuário tentou acessar uma página protegida)
    const attemptedRoute = getRoute(ATTEMPTED_ROUTE_KEY, true); // true = limpar após leitura
    if (attemptedRoute) {
      console.log("Redirecionando para rota tentada:", attemptedRoute.pathname);
      return attemptedRoute.pathname + (attemptedRoute.search || '');
    }
    
    // Se não houver rota tentada, verificar a última rota visitada
    const lastRoute = getRoute(ROUTE_STORAGE_KEY);
    if (lastRoute) {
      console.log("Redirecionando para última rota visitada:", lastRoute.pathname);
      return lastRoute.pathname + (lastRoute.search || '');
    }
    
    // Se não houver rotas salvas válidas, retornar a rota padrão
    return "/dashboard";
  };

  // Function to get evaluations from localStorage
  const getLocalStorageEvaluations = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('avaliacoes_exercicios') || '[]');
    } catch (error) {
      console.error('Error parsing local storage evaluations:', error);
      return [];
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLocalLoading(true);
    try {
      const { error } = await login(values.email, values.password);

      if (error) {
        return;
      }

      // Try to sync any localStorage evaluations
      if (user) {
        console.log("Iniciando sincronização de avaliações do localStorage");
        try {
          await syncLocalStorageWithDatabase();
        } catch (syncError) {
          console.error("Erro ao sincronizar avaliação:", syncError);
        }
      }
    } catch (err) {
      console.error("Erro no login:", err);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLocalLoading(false);
    }
  };

  const isLoading = isLocalLoading || isAuthLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-8 p-6 bg-card rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">GEN X - Painel de Gestão</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Faça login para acessar o painel de gerenciamento
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
              >
                Esqueci minha senha
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
