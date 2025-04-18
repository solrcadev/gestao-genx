/**
 * Script para corrigir problemas com múltiplas versões do React
 * 
 * Este script executa:
 * 1. npm dedupe - para tentar remover duplicações
 * 2. Adiciona um alias no vite.config.ts para garantir a mesma instância do React
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Iniciando correção de dependências do React...');

// Primeiro vamos executar npm dedupe para tentar resolver automaticamente
try {
  console.log('⚙️ Executando npm dedupe...');
  execSync('npm dedupe', { stdio: 'inherit' });
  console.log('✅ npm dedupe concluído');
} catch (error) {
  console.error('❌ Erro ao executar npm dedupe:', error.message);
}

// Agora vamos verificar o vite.config.ts para adicionar os alias
const viteConfigPath = path.resolve('vite.config.ts');

if (!fs.existsSync(viteConfigPath)) {
  console.error('❌ Arquivo vite.config.ts não encontrado');
  process.exit(1);
}

try {
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Verificar se já existe um alias para React
  if (!viteConfig.includes("'react': ") && !viteConfig.includes('"react": ')) {
    console.log('⚙️ Adicionando alias para React no vite.config.ts...');
    
    // Encontrar onde está a definição do resolve (se existir)
    if (viteConfig.includes('resolve: {')) {
      // Se já existe resolve, vamos adicionar os alias
      viteConfig = viteConfig.replace(
        'resolve: {',
        `resolve: {
    alias: {
      'react': path.resolve('node_modules/react'),
      'react-dom': path.resolve('node_modules/react-dom'),
    },`
      );
    } else if (viteConfig.includes('plugins: [')) {
      // Se não tem resolve, mas tem plugins, vamos adicionar resolve
      viteConfig = viteConfig.replace(
        'plugins: [',
        `resolve: {
    alias: {
      'react': path.resolve('node_modules/react'),
      'react-dom': path.resolve('node_modules/react-dom'),
    },
  },
  plugins: [`
      );
    } else {
      console.error('❌ Não foi possível encontrar um local adequado para adicionar o resolve no vite.config.ts');
      process.exit(1);
    }
    
    // Certificar-se de que path está sendo importado
    if (!viteConfig.includes("import path")) {
      viteConfig = viteConfig.replace(
        "import { defineConfig }",
        "import path from 'path';\nimport { defineConfig }"
      );
    }
    
    // Salvar as alterações
    fs.writeFileSync(viteConfigPath, viteConfig);
    console.log('✅ Alias adicionado ao vite.config.ts');
  } else {
    console.log('✅ vite.config.ts já possui alias para React');
  }
} catch (error) {
  console.error('❌ Erro ao modificar vite.config.ts:', error.message);
}

// Verificar o package.json para adicionar as resolutions
const packageJsonPath = path.resolve('package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Arquivo package.json não encontrado');
  process.exit(1);
}

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Verificar se já existe a seção de resolutions
  if (!packageJson.resolutions) {
    console.log('⚙️ Adicionando resolutions ao package.json...');
    
    // Obter a versão atual do React
    let reactVersion = '^18.2.0'; // Valor padrão
    
    if (packageJson.dependencies && packageJson.dependencies.react) {
      reactVersion = packageJson.dependencies.react;
    }
    
    // Adicionar resolutions
    packageJson.resolutions = {
      'react': reactVersion,
      'react-dom': reactVersion
    };
    
    // Salvar as alterações
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Resolutions adicionado ao package.json');
  } else {
    console.log('✅ package.json já possui a seção resolutions');
  }
} catch (error) {
  console.error('❌ Erro ao modificar package.json:', error.message);
}

console.log('\n🚀 Agora execute o seguinte comando para reinstalar as dependências:');
console.log('npm install');

console.log('\n💡 Se o problema persistir após reinstalar, tente executar:');
console.log('rm -rf node_modules && npm install');
console.log('npm run dev'); 