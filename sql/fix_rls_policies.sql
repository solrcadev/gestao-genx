-- Script para corrigir políticas RLS na tabela avaliacoes_exercicios
-- Este script modifica as políticas existentes para permitir inserção e seleção por todos os usuários autenticados 

-- Listar políticas existentes
SELECT *
FROM pg_policies
WHERE tablename = 'avaliacoes_exercicios';

-- Remover a política de inserção restritiva (se existir)
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir avaliacoes" ON public.avaliacoes_exercicios;

-- Criar política para permitir qualquer usuário autenticado inserir dados
CREATE POLICY "Qualquer usuario autenticado pode inserir avaliacoes" 
ON public.avaliacoes_exercicios 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Corrigir a política de seleção para permitir visualizar todas as avaliações
DROP POLICY IF EXISTS "Usuarios autenticados podem selecionar suas avaliacoes" ON public.avaliacoes_exercicios;

CREATE POLICY "Usuarios autenticados podem selecionar todas avaliacoes" 
ON public.avaliacoes_exercicios 
FOR SELECT 
TO authenticated 
USING (true);

-- Verificar as políticas após a modificação
SELECT *
FROM pg_policies
WHERE tablename = 'avaliacoes_exercicios';

-- Verificar a estrutura atual da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'avaliacoes_exercicios'; 