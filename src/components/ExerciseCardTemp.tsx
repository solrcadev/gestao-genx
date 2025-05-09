/**
 * Renderiza as estatísticas de uso do exercício
 */
const renderUsoStats = () => {
  // Exercício nunca usado
  if (!exercise.contagem_uso || exercise.contagem_uso === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <History className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Nunca utilizado</span>
      </div>
    );
  }
  
  // Usado, mas sem data (caso improvável, mas para robustez)
  if (!exercise.ultima_vez_usado) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <History className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Usado em {exercise.contagem_uso} {exercise.contagem_uso === 1 ? 'treino' : 'treinos'}
        </span>
      </div>
    );
  }
  
  // Caso completo: usado com data
  const dataFormatada = formatExerciseDate(exercise.ultima_vez_usado);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
      <History className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        Usado em {exercise.contagem_uso} {exercise.contagem_uso === 1 ? 'treino' : 'treinos'}. 
        {dataFormatada && (
          <>
            <span className="mx-1">·</span>
            <span className="inline-flex items-center">
              <Calendar className="h-3 w-3 mr-0.5" /> 
              Último: {dataFormatada}
            </span>
          </>
        )}
      </span>
    </div>
  );
}; 