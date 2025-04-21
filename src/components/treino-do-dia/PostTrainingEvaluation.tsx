import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { fetchPresencasAtletas, salvarAvaliacaoExercicio } from "@/services/treinosDoDiaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, CheckCircle2, PlusCircle, MinusCircle, ClipboardEdit } from "lucide-react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PostTrainingEvaluationProps {
  treinoDoDiaId: string;
}

const PostTrainingEvaluation: React.FC<PostTrainingEvaluationProps> = ({ treinoDoDiaId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [fundamento, setFundamento] = useState("Saque");
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAthletes();
    }
  }, [isOpen, treinoDoDiaId]);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const data = await fetchPresencasAtletas(treinoDoDiaId);
      // Filtramos apenas atletas presentes
      const presentAthletes = data.filter(item => item.presente);
      setAthletes(presentAthletes);
    } catch (error) {
      console.error("Erro ao carregar atletas:", error);
      toast({
        title: "Erro ao carregar atletas",
        description: "Não foi possível carregar a lista de atletas presentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAthlete(null);
    setFundamento("Saque");
    setAcertos(0);
    setErros(0);
    setObservacoes("");
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleAthleteSelect = (athlete: any) => {
    setSelectedAthlete(athlete);
  };

  const incrementAcertos = () => {
    setAcertos((prev) => prev + 1);
  };

  const decrementAcertos = () => {
    if (acertos > 0) {
      setAcertos((prev) => prev - 1);
    }
  };

  const incrementErros = () => {
    setErros((prev) => prev + 1);
  };

  const decrementErros = () => {
    if (erros > 0) {
      setErros((prev) => prev - 1);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedAthlete) {
      toast({
        title: "Selecione um atleta",
        description: "Você precisa selecionar um atleta para avaliação.",
        variant: "destructive",
      });
      return;
    }

    if (acertos === 0 && erros === 0) {
      toast({
        title: "Dados incompletos",
        description: "Adicione pelo menos um acerto ou erro para a avaliação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Geramos um UUID fictício para representar uma avaliação pós-treino
      // Formato de UUID v4 que é compatível com o banco de dados
      const randomUuid = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, 
                v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      // Usamos um UUID fictício em vez de uma string com timestamp
      const exercicioId = randomUuid();
      
      console.log("Tentando salvar avaliação pós-treino:", {
        atleta: selectedAthlete.atleta.nome,
        fundamento,
        acertos,
        erros,
        observacoes: observacoes ? "Preenchido" : "Vazio"
      });
      
      try {
        // Primeira tentativa: com observações
        await salvarAvaliacaoExercicio({
          treinoDoDiaId,
          exercicioId,
          atletaId: selectedAthlete.atleta.id,
          fundamento,
          acertos,
          erros,
          origem: 'avaliacao_pos_treino',
          observacoes
        });
        
        // Se chegou aqui, salvou com sucesso incluindo observações
        toast({
          title: "Avaliação salva!",
          description: `A avaliação de ${selectedAthlete.atleta.nome} foi salva com sucesso.`,
        });
      } catch (innerError: any) {
        console.error("Erro na primeira tentativa:", innerError);
        
        if (innerError.message && (
            innerError.message.includes("observacoes") || 
            innerError.message.includes("column") || 
            innerError.message.includes("PGRST204"))) {
          
          console.log("Tentando novamente sem o campo observações");
          
          // Segunda tentativa: sem observações
          await salvarAvaliacaoExercicio({
            treinoDoDiaId,
            exercicioId,
            atletaId: selectedAthlete.atleta.id,
            fundamento,
            acertos,
            erros,
            origem: 'avaliacao_pos_treino',
            observacoes: '' // String vazia para evitar problemas
          });
          
          // Se chegou aqui, salvou sem observações
          toast({
            title: "Avaliação salva parcialmente",
            description: `A avaliação de ${selectedAthlete.atleta.nome} foi salva, mas as observações não puderam ser registradas.`,
          });
          
          // Armazenar observações localmente como backup
          try {
            const observacoesBackup = {
              id: `obs_${Date.now()}`,
              treinoDoDiaId,
              exercicioId, 
              atletaId: selectedAthlete.atleta.id,
              fundamento,
              observacoes,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('observacoes_backup', 
              JSON.stringify([...JSON.parse(localStorage.getItem('observacoes_backup') || '[]'), observacoesBackup]));
          } catch (storageError) {
            console.error("Erro ao armazenar observações localmente:", storageError);
          }
        } else {
          // Se o erro não estiver relacionado com a coluna observacoes, apenas relança
          throw innerError;
        }
      }
      
      // Resetamos a avaliação atual mas mantemos o atleta selecionado para facilitar múltiplas avaliações
      setAcertos(0);
      setErros(0);
      setObservacoes("");
      
    } catch (error: any) {
      console.error("Erro ao salvar avaliação pós-treino:", error);
      console.error("Detalhes do erro:", error.message, error.details, error.hint);
      
      // Mensagem genérica com instruções para o usuário
      toast({
        title: "Erro ao salvar avaliação",
        description: "Não foi possível salvar a avaliação. Verifique sua conexão e tente novamente.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtramos os atletas pela busca
  const filteredAthletes = athletes.filter(item => 
    item.atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4 flex items-center gap-2">
          <ClipboardEdit className="w-4 h-4" />
          Avaliação Pós-Treino
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliação Pós-Treino</DialogTitle>
          <DialogDescription>
            Avalie os atletas individualmente em diferentes fundamentos, mesmo após o encerramento do exercício.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Lista de atletas (1/3 da tela) */}
          <div className="md:col-span-1 border rounded-lg p-4">
            <h3 className="font-medium mb-2">Atletas Presentes</h3>
            
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atleta..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredAthletes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhum atleta encontrado</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredAthletes.map((item) => (
                  <div 
                    key={item.atleta.id} 
                    className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                      selectedAthlete?.atleta.id === item.atleta.id 
                        ? "bg-primary/20 border-primary" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleAthleteSelect(item)}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        {item.atleta.foto_url ? (
                          <img 
                            src={item.atleta.foto_url} 
                            alt={item.atleta.nome}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {item.atleta.nome.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.atleta.nome}</p>
                        <p className="text-xs text-muted-foreground">{item.atleta.posicao}</p>
                      </div>
                      {selectedAthlete?.atleta.id === item.atleta.id && (
                        <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Formulário de avaliação (2/3 da tela) */}
          <div className="md:col-span-2 border rounded-lg p-4">
            {selectedAthlete ? (
              <div>
                <div className="mb-4 pb-2 border-b">
                  <h3 className="font-medium">Avaliando: {selectedAthlete.atleta.nome}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAthlete.atleta.posicao}</p>
                </div>
                
                <Tabs defaultValue="saque" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 md:grid-cols-6">
                    <TabsTrigger value="saque" onClick={() => setFundamento("Saque")}>
                      Saque
                    </TabsTrigger>
                    <TabsTrigger value="recepcao" onClick={() => setFundamento("Recepção")}>
                      Recepção
                    </TabsTrigger>
                    <TabsTrigger value="levantamento" onClick={() => setFundamento("Levantamento")}>
                      Levant.
                    </TabsTrigger>
                    <TabsTrigger value="ataque" onClick={() => setFundamento("Ataque")}>
                      Ataque
                    </TabsTrigger>
                    <TabsTrigger value="bloqueio" onClick={() => setFundamento("Bloqueio")}>
                      Bloqueio
                    </TabsTrigger>
                    <TabsTrigger value="defesa" onClick={() => setFundamento("Defesa")}>
                      Defesa
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Conteúdo comum para todas as abas */}
                  {['saque', 'recepcao', 'levantamento', 'ataque', 'bloqueio', 'defesa'].map(tab => (
                    <TabsContent key={tab} value={tab}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col items-center border rounded-lg p-4">
                          <div className="text-lg font-semibold mb-2">Acertos</div>
                          <div className="flex items-center">
                            <Button variant="outline" size="icon" onClick={decrementAcertos} disabled={acertos <= 0}>
                              <MinusCircle className="h-5 w-5" />
                            </Button>
                            <Input
                              type="number"
                              value={acertos}
                              readOnly
                              className="w-20 text-center mx-2"
                            />
                            <Button variant="outline" size="icon" onClick={incrementAcertos}>
                              <PlusCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col items-center border rounded-lg p-4">
                          <div className="text-lg font-semibold mb-2">Erros</div>
                          <div className="flex items-center">
                            <Button variant="outline" size="icon" onClick={decrementErros} disabled={erros <= 0}>
                              <MinusCircle className="h-5 w-5" />
                            </Button>
                            <Input
                              type="number"
                              value={erros}
                              readOnly
                              className="w-20 text-center mx-2"
                            />
                            <Button variant="outline" size="icon" onClick={incrementErros}>
                              <PlusCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">
                          Observações (opcional)
                        </label>
                        <Textarea
                          placeholder="Adicione observações sobre a avaliação..."
                          className="resize-none"
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleSaveEvaluation}
                        disabled={saving}
                      >
                        {saving && <LoadingSpinner className="mr-2" />}
                        Salvar Avaliação
                      </Button>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                <p className="text-muted-foreground mb-2">Selecione um atleta para avaliar</p>
                <p className="text-sm text-muted-foreground">Escolha um atleta da lista à esquerda para começar a avaliação</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostTrainingEvaluation; 