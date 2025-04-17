// Este script verifica e cria os buckets necessários no Supabase
const { createClient } = require('@supabase/supabase-js');

// Substitua estas variáveis de ambiente pelas suas próprias ou use um arquivo .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não definidas!');
  console.error('Certifique-se de configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const REQUIRED_BUCKETS = [
  { name: 'athletes-images', isPublic: true },
  { name: 'exercises-images', isPublic: true }
];

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Erro ao listar buckets:', error.message);
    return [];
  }
  
  return data || [];
}

async function createBucket(name, isPublic = true) {
  console.log(`Criando bucket '${name}'...`);
  
  const { data, error } = await supabase.storage.createBucket(name, {
    public: isPublic
  });
  
  if (error) {
    console.error(`Erro ao criar bucket '${name}':`, error.message);
    return false;
  }
  
  console.log(`Bucket '${name}' criado com sucesso!`);
  return true;
}

async function createPolicy(bucketName) {
  console.log(`Criando política para o bucket '${bucketName}'...`);
  
  // Criar política para permitir uploads
  const { error: uploadError } = await supabase.storage.from(bucketName)
    .createSignedUploadUrl('temp-policy-check.txt');
  
  if (uploadError && uploadError.message.includes('policy')) {
    // Se falhou por causa de política, tente criar uma
    console.log(`Configurando política para permitir uploads em '${bucketName}'...`);
    
    // Esta é uma maneira indireta de tentar garantir que o bucket tenha permissões
    // adequadas, pois a API do Supabase JS não permite criar políticas diretamente
    console.log(`Nota: Para configurar corretamente as políticas, você pode precisar ir ao painel do Supabase.`);
  }
}

async function checkAndCreateBuckets() {
  try {
    console.log('Verificando buckets existentes...');
    const existingBuckets = await listBuckets();
    const existingBucketNames = existingBuckets.map(bucket => bucket.name);
    
    console.log('Buckets existentes:', existingBucketNames.length ? existingBucketNames.join(', ') : 'Nenhum');
    
    for (const bucket of REQUIRED_BUCKETS) {
      if (!existingBucketNames.includes(bucket.name)) {
        console.log(`Bucket '${bucket.name}' não encontrado.`);
        const created = await createBucket(bucket.name, bucket.isPublic);
        
        if (created) {
          await createPolicy(bucket.name);
        }
      } else {
        console.log(`Bucket '${bucket.name}' já existe.`);
      }
    }
    
    console.log('\n✅ Verificação de buckets concluída!');
    console.log('Nota: Para configurar corretamente as políticas de acesso, acesse o painel do Supabase.');
    
  } catch (error) {
    console.error('Erro durante a verificação de buckets:', error);
  }
}

// Executar a função principal
checkAndCreateBuckets(); 