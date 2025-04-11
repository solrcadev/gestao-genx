export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      athletes: {
        Row: {
          altura: number
          created_at: string | null
          id: string
          idade: number
          imagem_url: string | null
          nome: string
          posicao: string
          time: string
          updated_at: string | null
        }
        Insert: {
          altura: number
          created_at?: string | null
          id?: string
          idade: number
          imagem_url?: string | null
          nome: string
          posicao: string
          time: string
          updated_at?: string | null
        }
        Update: {
          altura?: number
          created_at?: string | null
          id?: string
          idade?: number
          imagem_url?: string | null
          nome?: string
          posicao?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      avaliacoes_exercicios: {
        Row: {
          atleta_id: string
          created_at: string | null
          exercicio_id: string
          fundamento: string
          id: string
          nota: number
          treino_id: string
        }
        Insert: {
          atleta_id: string
          created_at?: string | null
          exercicio_id: string
          fundamento: string
          id?: string
          nota: number
          treino_id: string
        }
        Update: {
          atleta_id?: string
          created_at?: string | null
          exercicio_id?: string
          fundamento?: string
          id?: string
          nota?: number
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_exercicios_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_exercicios_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_exercicios_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_fundamento: {
        Row: {
          acertos: number
          atleta_id: string
          created_at: string | null
          erros: number
          exercicio_id: string
          fundamento: string
          id: string
          treino_id: string
        }
        Insert: {
          acertos?: number
          atleta_id: string
          created_at?: string | null
          erros?: number
          exercicio_id: string
          fundamento: string
          id?: string
          treino_id: string
        }
        Update: {
          acertos?: number
          atleta_id?: string
          created_at?: string | null
          erros?: number
          exercicio_id?: string
          fundamento?: string
          id?: string
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fundamento_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_fundamento_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      desempenho_fundamentos: {
        Row: {
          acertos: number
          created_at: string | null
          erros: number
          fundamento_id: string
          id: string
          treino_atleta_id: string
        }
        Insert: {
          acertos?: number
          created_at?: string | null
          erros?: number
          fundamento_id: string
          id?: string
          treino_atleta_id: string
        }
        Update: {
          acertos?: number
          created_at?: string | null
          erros?: number
          fundamento_id?: string
          id?: string
          treino_atleta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desempenho_fundamentos_fundamento_id_fkey"
            columns: ["fundamento_id"]
            isOneToOne: false
            referencedRelation: "fundamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desempenho_fundamentos_treino_atleta_id_fkey"
            columns: ["treino_atleta_id"]
            isOneToOne: false
            referencedRelation: "treinos_atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      exercicio_tag_relacao: {
        Row: {
          created_at: string | null
          exercicio_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          exercicio_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          exercicio_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercicio_tag_relacao_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercicio_tag_relacao_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "exercicio_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      exercicio_tags: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      exercicios: {
        Row: {
          categoria: string
          created_at: string | null
          descricao: string
          id: string
          imagem_url: string | null
          nome: string
          numero_jogadores: number
          objetivo: string
          tempo_estimado: number
          video_url: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao: string
          id?: string
          imagem_url?: string | null
          nome: string
          numero_jogadores: number
          objetivo: string
          tempo_estimado: number
          video_url?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          numero_jogadores?: number
          objetivo?: string
          tempo_estimado?: number
          video_url?: string | null
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          categorias: string[] | null
          created_at: string | null
          descricao: string
          duracao: number
          fundamentos: string[]
          id: string
          imagem_diagrama: string | null
          nivel_dificuldade: string
          nome: string
          numero_min_jogadores: number
          updated_at: string | null
          url_video: string | null
        }
        Insert: {
          categorias?: string[] | null
          created_at?: string | null
          descricao: string
          duracao: number
          fundamentos: string[]
          id?: string
          imagem_diagrama?: string | null
          nivel_dificuldade: string
          nome: string
          numero_min_jogadores: number
          updated_at?: string | null
          url_video?: string | null
        }
        Update: {
          categorias?: string[] | null
          created_at?: string | null
          descricao?: string
          duracao?: number
          fundamentos?: string[]
          id?: string
          imagem_diagrama?: string | null
          nivel_dificuldade?: string
          nome?: string
          numero_min_jogadores?: number
          updated_at?: string | null
          url_video?: string | null
        }
        Relationships: []
      }
      fundamentos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      historico_treinos: {
        Row: {
          created_at: string | null
          data: string
          id: string
          nome_treino: string
          status: string
          treino_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          nome_treino: string
          status: string
          treino_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          nome_treino?: string
          status?: string
          treino_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_treinos_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_execucoes: {
        Row: {
          atleta_id: string
          created_at: string | null
          exercicio_id: string
          fundamento: string
          id: string
          observacao: string | null
          resultado: boolean
          treino_id: string
        }
        Insert: {
          atleta_id: string
          created_at?: string | null
          exercicio_id: string
          fundamento: string
          id?: string
          observacao?: string | null
          resultado: boolean
          treino_id: string
        }
        Update: {
          atleta_id?: string
          created_at?: string | null
          exercicio_id?: string
          fundamento?: string
          id?: string
          observacao?: string | null
          resultado?: boolean
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_execucoes_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_execucoes_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_execucoes_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_evaluations: {
        Row: {
          comentario: string | null
          created_at: string | null
          exercicio_id: string | null
          id: string
          nota_eficiencia: number
          training_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          nota_eficiencia: number
          training_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          nota_eficiencia?: number
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluations_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluations_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_exercises: {
        Row: {
          concluido: boolean | null
          created_at: string | null
          exercicio_id: string | null
          id: string
          observacao: string | null
          ordem: number
          tempo: number
          training_id: string | null
        }
        Insert: {
          concluido?: boolean | null
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          observacao?: string | null
          ordem: number
          tempo: number
          training_id?: string | null
        }
        Update: {
          concluido?: boolean | null
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          tempo?: number
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_exercises_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_exercises_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          created_at: string | null
          data: string
          id: string
          local: string
          nome: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          local: string
          nome: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          local?: string
          nome?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      treinos: {
        Row: {
          created_at: string | null
          created_by: string
          data: string
          descricao: string | null
          horario: string | null
          id: string
          local: string | null
          nome: string
          time: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data: string
          descricao?: string | null
          horario?: string | null
          id?: string
          local?: string | null
          nome: string
          time?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data?: string
          descricao?: string | null
          horario?: string | null
          id?: string
          local?: string | null
          nome?: string
          time?: string
        }
        Relationships: []
      }
      treinos_atletas: {
        Row: {
          atleta_id: string
          created_at: string | null
          id: string
          justificativa_falta: string | null
          nota_geral: number | null
          observacoes: string | null
          presente: boolean | null
          treino_id: string
        }
        Insert: {
          atleta_id: string
          created_at?: string | null
          id?: string
          justificativa_falta?: string | null
          nota_geral?: number | null
          observacoes?: string | null
          presente?: boolean | null
          treino_id: string
        }
        Update: {
          atleta_id?: string
          created_at?: string | null
          id?: string
          justificativa_falta?: string | null
          nota_geral?: number | null
          observacoes?: string | null
          presente?: boolean | null
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinos_atletas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_atletas_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      treinos_do_dia: {
        Row: {
          aplicado: boolean | null
          created_at: string | null
          data: string
          id: string
          treino_id: string | null
        }
        Insert: {
          aplicado?: boolean | null
          created_at?: string | null
          data: string
          id?: string
          treino_id?: string | null
        }
        Update: {
          aplicado?: boolean | null
          created_at?: string | null
          data?: string
          id?: string
          treino_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinos_do_dia_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinos_exercicios: {
        Row: {
          created_at: string | null
          exercicio_id: string | null
          id: string
          observacao: string | null
          ordem: number
          treino_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          observacao?: string | null
          ordem: number
          treino_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          treino_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinos_exercicios_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_exercicios_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
