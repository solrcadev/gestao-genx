/**
 * Script para corrigir problemas com os hooks do React
 * Resolve os erros:
 * - "Invalid hook call"
 * - "Cannot read properties of null (reading 'useState')"
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
  console.log('🔍 Iniciando correção de problemas com hooks do React...');
  
  console.log('\n1. Verificando package.json...');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Garantir que as versões do React e React DOM são fixas (sem ^)
    const reactVersion = packageJson.dependencies.react;
    const reactDomVersion = packageJson.dependencies['react-dom'];
    
    // Remover o ^ para fixar a versão
    const fixedReactVersion = reactVersion.startsWith('^') ? reactVersion.substring(1) : reactVersion;
    const fixedReactDomVersion = reactDomVersion.startsWith('^') ? reactDomVersion.substring(1) : reactDomVersion;
    
    // Atualizar package.json
    packageJson.dependencies.react = fixedReactVersion;
    packageJson.dependencies['react-dom'] = fixedReactDomVersion;
    
    // Adicionar resoluções
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
    }
    
    packageJson.resolutions.react = fixedReactVersion;
    packageJson.resolutions['react-dom'] = fixedReactDomVersion;
    
    // Salvar alterações
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`✅ Versões fixadas: React ${fixedReactVersion}, React DOM ${fixedReactDomVersion}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar package.json:', error.message);
    return;
  }
  
  console.log('\n2. Verificando arquivos .npmrc...');
  try {
    const npmrcPath = path.join(__dirname, '.npmrc');
    let npmrcContent = '';
    
    if (fs.existsSync(npmrcPath)) {
      npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    }
    
    // Adicionar configurações necessárias ao .npmrc
    const requiredSettings = [
      'legacy-peer-deps=true',
      'dedupe-peer-deps=true',
      'resolution-mode=highest',
    ];
    
    let contentChanged = false;
    for (const setting of requiredSettings) {
      if (!npmrcContent.includes(setting)) {
        npmrcContent += setting + '\n';
        contentChanged = true;
      }
    }
    
    if (contentChanged) {
      fs.writeFileSync(npmrcPath, npmrcContent);
      console.log('✅ Arquivo .npmrc atualizado com configurações recomendadas');
    } else {
      console.log('✅ Arquivo .npmrc já contém todas as configurações necessárias');
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar arquivo .npmrc:', error.message);
  }
  
  console.log('\n3. Executando npm dedupe para eliminar duplicações...');
  try {
    const { stdout } = await execPromise('npm dedupe');
    console.log('✅ npm dedupe executado com sucesso');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Erro ao executar npm dedupe:', error.message);
  }
  
  console.log('\n4. Limpando o cache do npm...');
  try {
    await execPromise('npm cache clean --force');
    console.log('✅ Cache do npm limpo com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar o cache do npm:', error.message);
  }
  
  // Oferecer a opção de reinstalar os módulos
  console.log('\n🚀 Correções aplicadas!');
  console.log('\nPara completar a correção, você pode executar:');
  console.log('- npm install (para reinstalar as dependências)');
  console.log('- npm run dev (para iniciar a aplicação)');
  
  console.log('\nSe os problemas persistirem, execute:');
  console.log('rm -rf node_modules && npm install');
}

main().catch(error => {
  console.error('❌ Erro ao executar o script:', error);
  process.exit(1);
}); 