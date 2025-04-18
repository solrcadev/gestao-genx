/**
 * Script para detectar e corrigir múltiplas instâncias do React no projeto
 * Isso resolve o erro "Invalid hook call"
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Caminhos relativos
const nodeModulesPath = path.join(__dirname, 'node_modules');
const packageJsonPath = path.join(__dirname, 'package.json');

async function main() {
  console.log('Verificando duplicação de React no projeto...');
  
  // Função para encontrar todas as instâncias do React
  function findReactInstances() {
    console.log('Procurando por todas as instâncias do React...');
    
    const reactPaths = [];
    
    // Função para verificar recursivamente os diretórios
    function searchDirsRecursively(dirPath, maxDepth = 5, currentDepth = 0) {
      if (currentDepth > maxDepth) return;
      
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        // Verificar primeiro se há um package.json para otimizar a busca
        const hasPackageJson = entries.some(entry => entry.isFile() && entry.name === 'package.json');
        
        if (hasPackageJson) {
          const packageJsonPath = path.join(dirPath, 'package.json');
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            // Verificar se este é um pacote React
            if (packageJson.name === 'react') {
              reactPaths.push({
                path: dirPath,
                version: packageJson.version,
                packageJson: packageJsonPath
              });
              return; // Não precisa procurar mais neste diretório
            }
          } catch (e) {
            // Ignorar erros de parse do package.json
          }
        }
        
        // Procurar em subdiretórios
        for (const entry of entries) {
          if (entry.isDirectory()) {
            // Ignorar alguns diretórios comuns que não teriam o React
            if (entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'build') {
              searchDirsRecursively(path.join(dirPath, entry.name), maxDepth, currentDepth + 1);
            }
          }
        }
      } catch (err) {
        // Ignorar erros de acesso a diretório
      }
    }
    
    // Iniciar busca do node_modules
    searchDirsRecursively(nodeModulesPath, 5);
    
    return reactPaths;
  }
  
  const reactInstances = findReactInstances();
  
  if (reactInstances.length > 1) {
    console.log('\n⚠️ ALERTA: Múltiplas instâncias do React encontradas!');
    console.log('Isso está causando o erro "Invalid hook call" na aplicação.\n');
    
    console.log('Instâncias encontradas:');
    reactInstances.forEach((instance, index) => {
      console.log(`${index + 1}. Caminho: ${instance.path}`);
      console.log(`   Versão: ${instance.version}`);
      console.log(`   Package: ${instance.packageJson}\n`);
    });
    
    console.log('Iniciando correção automática...');
    
    try {
      // 1. Adicionar resoluções ao package.json
      console.log('1. Adicionando resoluções ao package.json...');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.resolutions) {
        packageJson.resolutions = {};
      }
      
      // Usar a versão mais recente encontrada
      const latestVersion = reactInstances.reduce((latest, current) => {
        if (!latest || current.version > latest) return current.version;
        return latest;
      }, null);
      
      packageJson.resolutions.react = latestVersion;
      packageJson.resolutions['react-dom'] = latestVersion;
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Resoluções adicionadas para React ${latestVersion}`);
      
      // 2. Eliminar duplicações
      console.log('\n2. Executando dedupe...');
      await execPromise('npm dedupe');
      console.log('✅ Dedupe concluído');
      
      // 3. Limpar node_modules e reinstalar
      console.log('\n3. Reinstalando dependências de forma limpa...');
      console.log('Isso pode demorar alguns minutos...');
      
      // Remover node_modules
      console.log('Removendo node_modules...');
      if (process.platform === 'win32') {
        await execPromise('rmdir /s /q node_modules');
      } else {
        await execPromise('rm -rf node_modules');
      }
      
      // Limpar cache do npm
      console.log('Limpando cache do npm...');
      await execPromise('npm cache clean --force');
      
      // Reinstalar
      console.log('Reinstalando dependências...');
      await execPromise('npm install');
      
      console.log('\n✅ Reinstalação concluída com sucesso!');
      
      console.log('\n🎉 Correção concluída! Agora execute "npm run dev" para iniciar a aplicação corrigida.');
    } catch (error) {
      console.error('\n❌ Erro durante a correção automática:', error.message);
      console.log('\nExecute as seguintes etapas manualmente:');
      console.log('1. Adicione ao seu package.json:');
      console.log(`
  "resolutions": {
    "react": "${reactInstances[0].version}",
    "react-dom": "${reactInstances[0].version}"
  },`);
      console.log('2. Execute os comandos:');
      console.log('   npm dedupe');
      console.log('   npm cache clean --force');
      console.log('   rm -rf node_modules');
      console.log('   npm install');
    }
  } else if (reactInstances.length === 1) {
    console.log(`\n✅ Apenas uma instância do React encontrada (versão ${reactInstances[0].version}).`);
    console.log('O problema "Invalid hook call" deve estar relacionado a outra causa.');
    console.log('\nVerifique se os provedores de contexto estão corretamente posicionados na árvore de componentes.');
  } else {
    console.log('\n❓ Nenhuma instância do React encontrada no projeto. Isso é inesperado.');
  }
}

main().catch(error => {
  console.error('Erro ao executar o script:', error);
  process.exit(1);
}); 