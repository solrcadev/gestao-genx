
import React from 'react';
import { HistoricoTreinosAtleta as BaseHistoricoTreinosAtleta } from '@/components/atleta/HistoricoTreinosAtleta';
import type { HistoricoTreinoPorAtleta } from '@/components/atleta/HistoricoTreinosAtleta';

// Este componente é apenas um wrapper para o componente base
export function HistoricoTreinosAtleta(props: { historico: HistoricoTreinoPorAtleta[], title?: string }) {
  return <BaseHistoricoTreinosAtleta {...props} />;
}

export default HistoricoTreinosAtleta;
