import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar variáveis de ambiente
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

// Inicializar cliente Supabase com service role key para acesso administrativo
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função principal
async function setupEventosQualificados() {
  try {
    console.log('Iniciando configuração das funções e tabela de eventos qualificados...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, '../db/create_eventos_qualificados_functions.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o conteúdo SQL em funções separadas
    const functions = sqlContent.split(';');
    
    // Executar cada função SQL
    for (const sql of functions) {
      const trimmedSql = sql.trim();
      if (trimmedSql) {
        console.log(`Executando SQL: ${trimmedSql.substring(0, 100)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: trimmedSql });
        
        if (error) {
          console.error('Erro ao executar SQL:', error);
        } else {
          console.log('SQL executado com sucesso');
        }
      }
    }
    
    // Verificar se a função check_table_exists existe
    const { data: checkFunctionExists, error: checkFunctionError } = await supabase
      .rpc('check_function_exists', { function_name: 'check_table_exists' });
    
    if (checkFunctionError) {
      console.error('Erro ao verificar função check_table_exists:', checkFunctionError);
    } else {
      console.log(`Função check_table_exists ${checkFunctionExists ? 'existe' : 'não existe'}`);
    }
    
    // Verificar se a função create_eventos_qualificados_table existe
    const { data: createFunctionExists, error: createFunctionError } = await supabase
      .rpc('check_function_exists', { function_name: 'create_eventos_qualificados_table' });
    
    if (createFunctionError) {
      console.error('Erro ao verificar função create_eventos_qualificados_table:', createFunctionError);
    } else {
      console.log(`Função create_eventos_qualificados_table ${createFunctionExists ? 'existe' : 'não existe'}`);
    }
    
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'eventos_qualificados' });
    
    if (tableError) {
      console.error('Erro ao verificar se a tabela existe:', tableError);
    } else {
      console.log(`Tabela eventos_qualificados ${tableExists ? 'existe' : 'não existe'}`);
      
      if (!tableExists) {
        console.log('Criando tabela eventos_qualificados...');
        
        const { data: createResult, error: createError } = await supabase
          .rpc('create_eventos_qualificados_table');
        
        if (createError) {
          console.error('Erro ao criar tabela:', createError);
        } else {
          console.log('Tabela criada com sucesso:', createResult);
        }
      }
    }
    
    console.log('Configuração concluída!');
  } catch (error) {
    console.error('Erro durante o processo de configuração:', error);
  }
}

// Executar função principal
setupEventosQualificados(); 