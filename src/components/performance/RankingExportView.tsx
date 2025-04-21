import React from 'react';
import { Medal, Trophy, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TeamType } from '@/types';
import '@/styles/ranking-export-styles.css';

// Tipos
type Fundamento = 'saque' | 'passe' | 'recepção' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa';

// Interface para os atletas no ranking
interface RankingAtleta {
  id: string;
  nome: string;
  percentual: number;
  totalExecucoes: number;
  acertos?: number;
}

interface RankingExportViewProps {
  fundamento: Fundamento;
  topAtletas: RankingAtleta[];
  team: TeamType;
  periodo?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

/**
 * Componente RankingExportView
 * 
 * Este componente é responsável por renderizar uma visualização otimizada para
 * exportação PDF/PNG do ranking de atletas. O layout foi projetado seguindo
 * os padrões visuais específicos do projeto.
 */
const RankingExportView: React.FC<RankingExportViewProps> = ({
  fundamento,
  topAtletas,
  team,
  periodo,
  dataInicio,
  dataFim
}) => {
  // Função para traduzir o fundamento
  const traduzirFundamento = (fund: Fundamento): string => {
    const traducoes: Record<string, string> = {
      'saque': 'Saque',
      'passe': 'Passe',
      'recepção': 'Recepção',
      'levantamento': 'Levantamento',
      'ataque': 'Ataque',
      'bloqueio': 'Bloqueio',
      'defesa': 'Defesa'
    };
    
    return traducoes[fund] || fund;
  };
  
  // Função para formatar período em texto
  const formatarPeriodo = (): string => {
    if (periodo === '7dias') return 'Últimos 7 dias';
    if (periodo === '30dias') return 'Últimos 30 dias';
    if (dataInicio && dataFim) {
      return `${format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dataFim, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    return format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  // Gerar uma mensagem de parabéns para o primeiro colocado
  const gerarMensagemParabenizacao = (nome: string): string => {
    return `🎉 Parabéns, ${nome}! Você foi o destaque da semana no fundamento ${traduzirFundamento(fundamento)}! Continue se dedicando! 💪🏽`;
  };
  
  // Retorna o ícone de medalha com base na posição
  const renderMedalha = (posicao: number) => {
    switch (posicao) {
      case 0:
        return <Medal className="w-6 h-6 medal-icon-gold" />;
      case 1:
        return <Medal className="w-6 h-6 medal-icon-silver" />;
      case 2:
        return <Medal className="w-6 h-6 medal-icon-bronze" />;
      default:
        return null;
    }
  };
  
  // Retorna a classe de estilo para a barra de progresso com base na posição
  const getProgressBarClass = (posicao: number): string => {
    switch (posicao) {
      case 0:
        return 'progress-bar-gold';
      case 1:
        return 'progress-bar-silver';
      case 2:
        return 'progress-bar-bronze';
      default:
        return 'progress-bar-gold';
    }
  };
  
  // Função para obter texto da medalha
  const getMedalhaTexto = (posicao: number): string => {
    switch (posicao) {
      case 0:
        return '🥇 1º lugar';
      case 1:
        return '🥈 2º lugar';
      case 2:
        return '🥉 3º lugar';
      default:
        return '';
    }
  };
  
  // Para garantir que mostramos apenas os top 3
  const atletas = topAtletas.slice(0, 3);
  const temAtletas = atletas.length > 0;
  
  return (
    <div className="ranking-export-container">
      {/* Fundo sólido em vez de gradiente para exportação */}
      <div className="ranking-export-background"></div>
      
      {/* Cabeçalho do Ranking */}
      <div className="ranking-export-header">
        <Trophy className="w-10 h-10 text-purple-400 mb-2" />
        <h1 className="ranking-export-title">
          Ranking de {traduzirFundamento(fundamento)}
        </h1>
        <p className="ranking-export-subtitle">
          Time {team} | {formatarPeriodo()}
        </p>
      </div>
      
      {/* Lista de Atletas */}
      <div className="space-y-4">
        {temAtletas ? (
          <>
            {/* Mensagem de parabéns para o primeiro colocado */}
            {atletas.length > 0 && (
              <div className="congrats-message">
                {gerarMensagemParabenizacao(atletas[0].nome)}
              </div>
            )}
            
            {/* Cards dos atletas */}
            {atletas.map((atleta, index) => (
              <div key={atleta.id} className="ranking-athlete-card">
                <div className="medal-icon-wrapper">
                  {renderMedalha(index)}
                </div>
                
                <div className="athlete-info">
                  <h3 className="athlete-name">{atleta.nome}</h3>
                  <p className="athlete-stats">
                    {atleta.acertos ? `${atleta.acertos}/${atleta.totalExecucoes} execuções` : `${atleta.totalExecucoes} execuções`}
                    {' '} | {getMedalhaTexto(index)}
                  </p>
                  
                  {/* Barra de progresso */}
                  <div className="progress-container">
                    <div 
                      className={getProgressBarClass(index)} 
                      style={{ width: `${atleta.percentual}%` }}
                    ></div>
                  </div>
                </div>
                
                <span className="athlete-percentage">
                  {atleta.percentual.toFixed(1).replace('.', ',')}%
                </span>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <Star className="w-14 h-14 mx-auto mb-3 opacity-30 text-purple-300" />
            <p>Nenhum atleta com mais de 5 tentativas neste fundamento no período selecionado.</p>
          </div>
        )}
      </div>
      
      {/* Marca d'água */}
      <div className="ranking-export-watermark">
        Gerado por GenX Sports em {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
      </div>
    </div>
  );
};

export default RankingExportView; 