-- Funções personalizadas para manipular a tabela perfis
-- Estas funções evitam problemas com os triggers de atualização automática de data

-- Função para atualizar um perfil de atleta
CREATE OR REPLACE FUNCTION public.atualizar_perfil_atleta(
  perfil_id uuid,
  p_atleta_id uuid
) RETURNS void AS $$
BEGIN
  -- Atualize diretamente com SQL sem depender do trigger
  EXECUTE 'UPDATE public.perfis 
           SET funcao = ''atleta'', 
               atleta_id = ''' || p_atleta_id || ''', 
               status = ''ativo''
           WHERE id = ''' || perfil_id || '''';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar o user_id de um perfil existente
CREATE OR REPLACE FUNCTION public.atualizar_perfil_atleta_user(
  p_id uuid,
  p_user_id uuid
) RETURNS void AS $$
BEGIN
  -- Atualize diretamente com SQL sem depender do trigger
  EXECUTE 'UPDATE public.perfis 
           SET user_id = ''' || p_user_id || ''', 
               status = ''ativo''
           WHERE id = ''' || p_id || '''';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar um novo perfil de atleta
CREATE OR REPLACE FUNCTION public.criar_perfil_atleta(
  p_user_id uuid,
  p_atleta_id uuid
) RETURNS void AS $$
BEGIN
  -- Insira diretamente com SQL sem depender do trigger
  EXECUTE 'INSERT INTO public.perfis (
             id, 
             user_id, 
             funcao, 
             atleta_id, 
             status
           ) VALUES (
             gen_random_uuid(), 
             ''' || p_user_id || ''', 
             ''atleta'', 
             ''' || p_atleta_id || ''', 
             ''ativo''
           )';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para executar SQL personalizado
CREATE OR REPLACE FUNCTION public.executar_sql(
  sql_query text
) RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 