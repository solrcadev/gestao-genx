import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface AvaliacaoQualitativa {
  id: string;
  atleta_id: string;
  fundamento: string;
  tipo_evento: string;
  peso: number;
  timestamp: string;
  observacoes: string;
}

export function useAvaliacoesAtleta(atletaId: string | undefined) {
  return useQuery({
    queryKey: ["avaliacoes", atletaId],
    queryFn: async () => {
      if (!atletaId) return [];
      
      const { data, error } = await supabase
        .from("avaliacoes_fundamento")
        .select("*")
        .eq("atleta_id", atletaId)
        .order("timestamp", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as AvaliacaoQualitativa[];
    },
    enabled: !!atletaId,
  });
}
