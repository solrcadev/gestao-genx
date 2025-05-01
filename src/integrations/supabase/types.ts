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
      atas_reuniao: {
        Row: {
          created_at: string | null
          data: string
          decisoes: Json | null
          id: string
          participantes: string[] | null
          titulo: string
          topicos: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          decisoes?: Json | null
          id?: string
          participantes?: string[] | null
          titulo: string
          topicos?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          decisoes?: Json | null
          id?: string
          participantes?: string[] | null
          titulo?: string
          topicos?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      athletes: {
        Row: {
          access_status: string | null
          altura: number
          created_at: string | null
          email: string | null
          foto_url: string | null
          id: string
          idade: number
          imagem_url: string | null
          nome: string
          posicao: string
          telefone: string | null
          time: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_status?: string | null
          altura: number
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          idade: number
          imagem_url?: string | null
          nome: string
          posicao: string
          telefone?: string | null
          time: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_status?: string | null
          altura?: number
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          idade?: number
          imagem_url?: string | null
          nome?: string
          posicao?: string
          telefone?: string | null
          time?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      avaliacoes_eventos_qualificados: {
        Row: {
          atleta_id: string
          created_at: string | null
          fundamento: string
          id: string
          observacoes: string | null
          peso: number
          timestamp: string | null
          tipo_evento: string
          treino_id: string | null
          updated_at: string | null
        }
        Insert: {
          atleta_id: string
          created_at?: string | null
          fundamento: string
          id?: string
          observacoes?: string | null
          peso: number
          timestamp?: string | null
          tipo_evento: string
          treino_id?: string | null
          updated_at?: string | null
        }
        Update: {
          atleta_id?: string
          created_at?: string | null
          fundamento?: string
          id?: string
          observacoes?: string | null
          peso?: number
          timestamp?: string | null
          tipo_evento?: string
          treino_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_atleta"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_atleta"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
      avaliacoes_exercicios_backup: {
        Row: {
          acertos: number | null
          atleta_id: string | null
          created_at: string | null
          erros: number | null
          exercicio_id: string | null
          fundamento: string | null
          id: string | null
          timestamp: string | null
          treino_id: string | null
        }
        Insert: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
          timestamp?: string | null
          treino_id?: string | null
        }
        Update: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
          timestamp?: string | null
          treino_id?: string | null
        }
        Relationships: []
      }
      avaliacoes_fundamento: {
        Row: {
          acertos: number
          atleta_id: string
          created_at: string | null
          data_avaliacao: string | null
          erros: number
          exercicio_id: string | null
          fundamento: string
          id: string
          observacoes: string | null
          origem: string | null
          timestamp: string | null
          treino_id: string
        }
        Insert: {
          acertos?: number
          atleta_id: string
          created_at?: string | null
          data_avaliacao?: string | null
          erros?: number
          exercicio_id?: string | null
          fundamento: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          timestamp?: string | null
          treino_id: string
        }
        Update: {
          acertos?: number
          atleta_id?: string
          created_at?: string | null
          data_avaliacao?: string | null
          erros?: number
          exercicio_id?: string | null
          fundamento?: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          timestamp?: string | null
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
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
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
      avaliacoes_historico: {
        Row: {
          acertos_anterior: number
          avaliacao_id: string
          created_at: string
          data_modificacao: string
          erros_anterior: number
          id: string
          tecnico_id: string
        }
        Insert: {
          acertos_anterior: number
          avaliacao_id: string
          created_at?: string
          data_modificacao?: string
          erros_anterior: number
          id?: string
          tecnico_id: string
        }
        Update: {
          acertos_anterior?: number
          avaliacao_id?: string
          created_at?: string
          data_modificacao?: string
          erros_anterior?: number
          id?: string
          tecnico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_historico_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_historico_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_exercicios_original"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_historico_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_fundamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_historico_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "v_avaliacoes_fundamento_resumidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_historico_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_pendentes: {
        Row: {
          atleta_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          nome: string | null
          status: string | null
        }
        Insert: {
          atleta_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          nome?: string | null
          status?: string | null
        }
        Update: {
          atleta_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          nome?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_pendentes_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_pendentes_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
          {
            foreignKeyName: "fk_convites_atleta"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_convites_atleta"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
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
      destaques_atletas: {
        Row: {
          atleta_id: string | null
          created_at: string | null
          dados_evolucao: Json | null
          fundamento: string
          id: string
          percentual_evolucao: number | null
          semana_fim: string
          semana_inicio: string
          time_type: string
        }
        Insert: {
          atleta_id?: string | null
          created_at?: string | null
          dados_evolucao?: Json | null
          fundamento: string
          id?: string
          percentual_evolucao?: number | null
          semana_fim: string
          semana_inicio: string
          time_type: string
        }
        Update: {
          atleta_id?: string | null
          created_at?: string | null
          dados_evolucao?: Json | null
          fundamento?: string
          id?: string
          percentual_evolucao?: number | null
          semana_fim?: string
          semana_inicio?: string
          time_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "destaques_atletas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destaques_atletas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
      exclusoes_log: {
        Row: {
          created_at: string
          data_exclusao: string
          id: string
          registro_id: string
          tabela: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_exclusao?: string
          id?: string
          registro_id: string
          tabela: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_exclusao?: string
          id?: string
          registro_id?: string
          tabela?: string
          usuario_id?: string
        }
        Relationships: []
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
      historico_metas: {
        Row: {
          created_at: string | null
          id: string
          meta_id: string
          observacao: string | null
          progresso: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta_id: string
          observacao?: string | null
          progresso: number
        }
        Update: {
          created_at?: string | null
          id?: string
          meta_id?: string
          observacao?: string | null
          progresso?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_meta"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
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
      macrociclos: {
        Row: {
          created_at: string | null
          created_by: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      mesociclos: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          macrociclo_id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          macrociclo_id: string
          nome: string
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          macrociclo_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesociclos_macrociclo_id_fkey"
            columns: ["macrociclo_id"]
            isOneToOne: false
            referencedRelation: "macrociclos"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          atleta_id: string
          created_at: string | null
          data_alvo: string
          descricao: string | null
          id: string
          observacoes: string | null
          progresso: number | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          atleta_id: string
          created_at?: string | null
          data_alvo: string
          descricao?: string | null
          id?: string
          observacoes?: string | null
          progresso?: number | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          atleta_id?: string
          created_at?: string | null
          data_alvo?: string
          descricao?: string | null
          id?: string
          observacoes?: string | null
          progresso?: number | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_atleta"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_atleta"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
      microciclos: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          mesociclo_id: string
          nome: string
          objetivo: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          mesociclo_id: string
          nome: string
          objetivo?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          mesociclo_id?: string
          nome?: string
          objetivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "microciclos_mesociclo_id_fkey"
            columns: ["mesociclo_id"]
            isOneToOne: false
            referencedRelation: "mesociclos"
            referencedColumns: ["id"]
          },
        ]
      }
      microciclos_treinos: {
        Row: {
          created_at: string | null
          id: string
          microciclo_id: string
          posicao: number | null
          treino_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          microciclo_id: string
          posicao?: number | null
          treino_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          microciclo_id?: string
          posicao?: number | null
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "microciclos_treinos_microciclo_id_fkey"
            columns: ["microciclo_id"]
            isOneToOne: false
            referencedRelation: "microciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "microciclos_treinos_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_historico: {
        Row: {
          created_at: string | null
          data: Json | null
          enviadas: number | null
          falhas: number | null
          id: string
          mensagem: string
          target_id: string | null
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          enviadas?: number | null
          falhas?: number | null
          id?: string
          mensagem: string
          target_id?: string | null
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          enviadas?: number | null
          falhas?: number | null
          id?: string
          mensagem?: string
          target_id?: string | null
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notificacoes_preferencias: {
        Row: {
          athlete_id: string | null
          ausencias_sem_justificativa: boolean | null
          avaliacoes: boolean | null
          created_at: string | null
          id: string
          lembretes_treino: boolean | null
          novas_metas: boolean | null
          ranking_semanal: boolean | null
          treino_do_dia: boolean | null
          updated_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          ausencias_sem_justificativa?: boolean | null
          avaliacoes?: boolean | null
          created_at?: string | null
          id?: string
          lembretes_treino?: boolean | null
          novas_metas?: boolean | null
          ranking_semanal?: boolean | null
          treino_do_dia?: boolean | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          ausencias_sem_justificativa?: boolean | null
          avaliacoes?: boolean | null
          created_at?: string | null
          id?: string
          lembretes_treino?: boolean | null
          novas_metas?: boolean | null
          ranking_semanal?: boolean | null
          treino_do_dia?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_preferencias_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_preferencias_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
      notificacoes_subscriptions: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          device_info: Json | null
          endpoint: string
          id: string
          last_used: string | null
          subscription_data: Json
          updated_at: string | null
          user_role: string
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          endpoint: string
          id?: string
          last_used?: string | null
          subscription_data: Json
          updated_at?: string | null
          user_role?: string
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          device_info?: Json | null
          endpoint?: string
          id?: string
          last_used?: string | null
          subscription_data?: Json
          updated_at?: string | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_subscriptions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_subscriptions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
      perfis: {
        Row: {
          atleta_id: string | null
          funcao: string
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          atleta_id?: string | null
          funcao: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          atleta_id?: string | null
          funcao?: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
      rankings: {
        Row: {
          created_at: string | null
          dados: Json
          destaques: Json | null
          fundamento: string
          id: string
          periodo_fim: string
          periodo_inicio: string
          time_type: string
        }
        Insert: {
          created_at?: string | null
          dados: Json
          destaques?: Json | null
          fundamento: string
          id?: string
          periodo_fim: string
          periodo_inicio: string
          time_type: string
        }
        Update: {
          created_at?: string | null
          dados?: Json
          destaques?: Json | null
          fundamento?: string
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          time_type?: string
        }
        Relationships: []
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
            foreignKeyName: "registro_execucoes_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
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
      subscriptions: {
        Row: {
          atleta_id: string | null
          created_at: string | null
          id: string
          subscription_data: Json
          updated_at: string | null
        }
        Insert: {
          atleta_id?: string | null
          created_at?: string | null
          id?: string
          subscription_data: Json
          updated_at?: string | null
        }
        Update: {
          atleta_id?: string | null
          created_at?: string | null
          id?: string
          subscription_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
            foreignKeyName: "treinos_atletas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
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
          concluido: boolean | null
          created_at: string | null
          exercicio_id: string | null
          id: string
          observacao: string | null
          ordem: number
          tempo_real: number | null
          treino_id: string | null
        }
        Insert: {
          concluido?: boolean | null
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          observacao?: string | null
          ordem: number
          tempo_real?: number | null
          treino_id?: string | null
        }
        Update: {
          concluido?: boolean | null
          created_at?: string | null
          exercicio_id?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          tempo_real?: number | null
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
      treinos_presencas: {
        Row: {
          atleta_id: string
          created_at: string
          id: string
          justificativa: string | null
          presente: boolean
          treino_do_dia_id: string
        }
        Insert: {
          atleta_id: string
          created_at?: string
          id?: string
          justificativa?: string | null
          presente?: boolean
          treino_do_dia_id: string
        }
        Update: {
          atleta_id?: string
          created_at?: string
          id?: string
          justificativa?: string | null
          presente?: boolean
          treino_do_dia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinos_presencas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinos_presencas_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
          {
            foreignKeyName: "treinos_presencas_treino_do_dia_id_fkey"
            columns: ["treino_do_dia_id"]
            isOneToOne: false
            referencedRelation: "treinos_do_dia"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          encrypted_password: string
          id: string
          nome: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          encrypted_password: string
          id?: string
          nome: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          encrypted_password?: string
          id?: string
          nome?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      view_definitions_backup: {
        Row: {
          backup_date: string | null
          definition: string | null
          view_name: string
        }
        Insert: {
          backup_date?: string | null
          definition?: string | null
          view_name: string
        }
        Update: {
          backup_date?: string | null
          definition?: string | null
          view_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      avaliacoes_exercicios: {
        Row: {
          acertos: number | null
          atleta_id: string | null
          created_at: string | null
          erros: number | null
          exercicio_id: string | null
          fundamento: string | null
          id: string | null
          observacoes: string | null
          origem: string | null
        }
        Insert: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
          observacoes?: string | null
          origem?: string | null
        }
        Update: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
          observacoes?: string | null
          origem?: string | null
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
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
          {
            foreignKeyName: "avaliacoes_fundamento_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_exercicios_original: {
        Row: {
          acertos: number | null
          atleta_id: string | null
          created_at: string | null
          erros: number | null
          exercicio_id: string | null
          fundamento: string | null
          id: string | null
        }
        Insert: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
        }
        Update: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
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
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
          {
            foreignKeyName: "avaliacoes_fundamento_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
        ]
      }
      v_avaliacoes_fundamento_resumidas: {
        Row: {
          acertos: number | null
          atleta_id: string | null
          created_at: string | null
          erros: number | null
          exercicio_id: string | null
          fundamento: string | null
          id: string | null
          observacoes: string | null
          origem: string | null
        }
        Insert: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
          observacoes?: string | null
          origem?: string | null
        }
        Update: {
          acertos?: number | null
          atleta_id?: string | null
          created_at?: string | null
          erros?: number | null
          exercicio_id?: string | null
          fundamento?: string | null
          id?: string | null
          observacoes?: string | null
          origem?: string | null
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
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
          {
            foreignKeyName: "avaliacoes_fundamento_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_avaliacao_qualitativa_media: {
        Row: {
          atleta_id: string | null
          atleta_nome: string | null
          avaliacao_qualitativa: string | null
          avaliacoes_negativas: number | null
          avaliacoes_positivas: number | null
          fundamento: string | null
          media_peso: number | null
          nota_percentual: number | null
          time: string | null
          total_avaliacoes: number | null
          ultima_avaliacao: string | null
        }
        Relationships: []
      }
      vw_avaliacoes: {
        Row: {
          acertos: number | null
          atleta_id: string | null
          atleta_nome: string | null
          created_at: string | null
          erros: number | null
          exercicio_id: string | null
          fundamento: string | null
          id: string | null
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
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
          {
            foreignKeyName: "avaliacoes_fundamento_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_fundamentos_ranking: {
        Row: {
          atleta_id: string | null
          eficiencia: number | null
          fundamento: string | null
          total_acertos: number | null
          total_erros: number | null
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
            foreignKeyName: "avaliacoes_fundamento_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "vw_avaliacao_qualitativa_media"
            referencedColumns: ["atleta_id"]
          },
        ]
      }
    }
    Functions: {
      atualizar_perfil_atleta: {
        Args: { perfil_id: string; p_atleta_id: string }
        Returns: undefined
      }
      atualizar_perfil_atleta_user: {
        Args: { p_id: string; p_user_id: string }
        Returns: undefined
      }
      backup_avaliacoes_exercicios_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_ranking_score: {
        Args: { acertos: number; erros: number }
        Returns: number
      }
      cleanup_old_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      criar_perfil_atleta: {
        Args: { p_user_id: string; p_atleta_id: string }
        Returns: undefined
      }
      criar_tabela_atas_reuniao: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      criar_tabela_eventos_qualificados: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      executar_sql: {
        Args: { sql_query: string }
        Returns: undefined
      }
      fix_security_definer_views: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_role: {
        Args: { requested_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "coach" | "athlete"
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
    Enums: {
      user_role: ["coach", "athlete"],
    },
  },
} as const
