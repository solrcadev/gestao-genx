import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BucketCreationGuideProps {
  open: boolean;
  onClose: () => void;
}

export function BucketCreationGuide({ open, onClose }: BucketCreationGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Como criar os buckets necessários no Supabase</DialogTitle>
          <DialogDescription>
            Siga estas instruções para configurar seu armazenamento no Supabase
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">1. Acesse o painel do Supabase</h3>
              <p className="text-sm text-muted-foreground">
                Vá para <a href="https://app.supabase.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">app.supabase.com</a> e faça login na sua conta.
              </p>
            </section>
            
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">2. Selecione seu projeto</h3>
              <p className="text-sm text-muted-foreground">
                Na dashboard do Supabase, escolha o projeto que está usando para esta aplicação.
              </p>
            </section>
            
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">3. Acesse a seção de Storage</h3>
              <p className="text-sm text-muted-foreground">
                No menu lateral, clique em "Storage" para acessar o gerenciamento de armazenamento.
              </p>
            </section>
            
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">4. Crie os buckets necessários</h3>
              <p className="text-sm text-muted-foreground">
                Você precisa criar dois buckets para o sistema funcionar corretamente. Para cada bucket, clique no botão "Create new bucket" ou "New bucket".
              </p>

              <h4 className="text-base font-medium">4.1 Bucket para fotos de atletas</h4>
              <p className="text-sm text-muted-foreground">
                No formulário que aparece:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                <li>Digite <span className="font-mono bg-muted px-1 rounded">athletes-images</span> como nome do bucket</li>
                <li>Marque a opção "Public" para permitir acesso público às imagens</li>
                <li>Clique em "Create bucket" para finalizar</li>
              </ul>

              <h4 className="text-base font-medium mt-3">4.2 Bucket para imagens de exercícios</h4>
              <p className="text-sm text-muted-foreground">
                Repita o processo para o segundo bucket:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                <li>Digite <span className="font-mono bg-muted px-1 rounded">exercises-images</span> como nome do bucket</li>
                <li>Marque a opção "Public" para permitir acesso público às imagens</li>
                <li>Clique em "Create bucket" para finalizar</li>
              </ul>
            </section>
            
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">5. Configure as permissões</h3>
              <p className="text-sm text-muted-foreground">
                Para cada bucket criado, vá para a aba "Policies" e configure uma política para permitir uploads:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 space-y-1">
                <li>Clique em "Add policy" ou "New policy"</li>
                <li>Selecione a opção para upload ou template "Create upload policy"</li>
                <li>Defina "Policy name" (ex: "Allow uploads")</li>
                <li>Para começar de forma simples, você pode permitir todos os uploads com a expressão <span className="font-mono bg-muted px-1 rounded">true</span></li>
                <li>Clique em "Save policy"</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Isso criará uma política que permite uploads para o bucket, configurando assim todas as permissões necessárias.
              </p>
            </section>
            
            <section className="space-y-2 pt-4">
              <h3 className="text-lg font-semibold text-primary">Importante</h3>
              <p className="text-sm text-muted-foreground">
                Após criar os buckets e configurar as políticas, atualize a página da aplicação e tente novamente o upload das imagens.
              </p>
              <p className="text-sm text-muted-foreground">
                Para um ambiente de produção, recomenda-se configurar políticas mais seguras que apenas permitam uploads para usuários autenticados.
              </p>
            </section>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={onClose}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 