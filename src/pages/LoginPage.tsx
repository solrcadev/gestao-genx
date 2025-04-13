import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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

// Esquema de validação do formulário
const formSchema = z.object({
  email: z.string().email({ message: "Digite um email válido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type FormValues = z.infer<typeof formSchema>;

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        let errorMessage = "Falha no login. Tente novamente.";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Seu email ainda não foi confirmado.";
        }

        toast({
          title: "Erro ao fazer login",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("Login error:", error);
      } else {
        // Login bem-sucedido
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta!",
        });
        
        // Tentar sincronizar dados locais com o banco após login bem-sucedido
        try {
          await syncLocalStorageWithDatabase();
        } catch (syncError) {
          console.error("Erro ao sincronizar dados após login:", syncError);
          // Não interrompe o fluxo se a sincronização falhar
        }
        
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Unexpected error during login:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para sincronizar dados locais com o banco
  async function syncLocalEvaluations() {
    const localEvaluations = getLocalStorageEvaluations();
    
    for (const evaluation of localEvaluations) {
      try {
        const { error } = await supabase
          .from('avaliacoes_exercicios')
          .insert([evaluation]);
          
        if (!error) {
          // Remover avaliação do armazenamento local após sincronização bem-sucedida
          removeFromLocalStorage(evaluation.id);
        }
      } catch (err) {
        console.error('Erro ao sincronizar avaliação:', err);
      }
    }
  }

  // Chamar esta função periodicamente ou quando o usuário voltar online

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
                  // Implementar a recuperação de senha
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