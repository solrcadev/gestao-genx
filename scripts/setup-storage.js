// Execute este script para configurar os buckets do Supabase
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'createBuckets.js');

// Verificar se o script existe
if (!fs.existsSync(scriptPath)) {
  console.error(`Erro: O script não foi encontrado em ${scriptPath}`);
  process.exit(1);
}

console.log('=== Configuração dos Buckets do Supabase ===');
console.log('Este script irá criar os buckets necessários para o upload de imagens.');
console.log('Certifique-se de que suas variáveis de ambiente do Supabase estão configuradas corretamente.');
console.log('\nExecutando...\n');

// Executar o script de criação de buckets
exec(`node ${scriptPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar o script: ${error.message}`);
    console.error('Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas corretamente.');
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Erro no script: ${stderr}`);
    process.exit(1);
  }
  
  console.log(stdout);
  console.log('\n=== Configuração concluída ===');
  console.log('Os buckets necessários foram verificados e criados se necessário.');
  console.log('\nPróximos passos:');
  console.log('1. Certifique-se de que as políticas de acesso estão configuradas corretamente no console do Supabase');
  console.log('2. Teste o upload de imagens na aplicação');
  console.log('3. Se ainda houver problemas, verifique os logs de erro no console do navegador');
}); 