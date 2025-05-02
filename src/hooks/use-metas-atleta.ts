
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Meta {
  id: string;
  titulo: string;
  descricao: string;
  data_alvo: string;
  progresso: number;
  atleta_id: string;
  created_at: string;
}

export function useMetasAtleta(atletaId: string | undefined) {
  return useQuery({
    queryKey: ["metas", atletaId],
    queryFn: async () => {
      if (!atletaId) return [];
      
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("atleta_id", atletaId)
        .order("data_alvo", { ascending: true });
      
      if (error) throw error;
      return data as Meta[];
    },
    enabled: !!atletaId,
  });
}
