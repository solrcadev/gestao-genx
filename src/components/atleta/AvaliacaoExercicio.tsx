import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { salvarAvaliacao, salvarAvaliacaoLocal, sincronizarAvaliacoesLocais } from '@/services/avaliacaoService';

interface AvaliacaoExercicioProps {
  atletaId: string;
  fundamentoId: string;
  treinoDoDiaId: string;
  onConcluir: () => void;
}

const AvaliacaoExercicio: React.FC<AvaliacaoExercicioProps> = ({
  atletaId,
  fundamentoId,
  treinoDoDiaId,
  onConcluir
}) => {
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Sincronizar avaliações pendentes ao montar o componente
    sincronizarAvaliacoesLocais().catch(error => {
      console.error('Erro ao sincronizar avaliações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível sincronizar as avaliações pendentes',
        variant: 'destructive'
      });
    });
  }, []);

  const handleAcerto = async () => {
    const novoAcertos = acertos + 1;
    setAcertos(novoAcertos);
    
    try {
      const avaliacao = {
        treino_do_dia_id: treinoDoDiaId,
        atleta_id: atletaId,
        fundamento_id: fundamentoId,
        acertos: novoAcertos,
        erros: erros
      };

      // Tentar salvar no Supabase
      try {
        await salvarAvaliacao(avaliacao);
      } catch (error) {
        // Se falhar, salvar localmente
        console.log('Falha ao salvar no Supabase, salvando localmente...');
        salvarAvaliacaoLocal(avaliacao);
      }
    } catch (error) {
      console.error('Erro ao processar acerto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o acerto',
        variant: 'destructive'
      });
    }
  };

  const handleErro = async () => {
    const novoErros = erros + 1;
    setErros(novoErros);
    
    try {
      const avaliacao = {
        treino_do_dia_id: treinoDoDiaId,
        atleta_id: atletaId,
        fundamento_id: fundamentoId,
        acertos: acertos,
        erros: novoErros
      };

      // Tentar salvar no Supabase
      try {
        await salvarAvaliacao(avaliacao);
      } catch (error) {
        // Se falhar, salvar localmente
        console.log('Falha ao salvar no Supabase, salvando localmente...');
        salvarAvaliacaoLocal(avaliacao);
      }
    } catch (error) {
      console.error('Erro ao processar erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o erro',
        variant: 'destructive'
      });
    }
  };

  const handleConcluir = async () => {
    try {
      // Sincronizar avaliações pendentes antes de concluir
      await sincronizarAvaliacoesLocais();
      onConcluir();
    } catch (error) {
      console.error('Erro ao concluir avaliação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível sincronizar as avaliações antes de concluir',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-lg font-semibold">Avaliação do Exercício</div>
        
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{acertos}</div>
            <div className="text-sm text-muted-foreground">Acertos</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{erros}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            className="bg-green-100 hover:bg-green-200"
            onClick={handleAcerto}
          >
            Acerto
          </Button>
          
          <Button 
            variant="outline" 
            className="bg-red-100 hover:bg-red-200"
            onClick={handleErro}
          >
            Erro
          </Button>
        </div>

        <Button 
          variant="default" 
          onClick={handleConcluir}
          className="mt-4"
        >
          Concluir Avaliação
        </Button>
      </div>
    </Card>
  );
};

export default AvaliacaoExercicio; 