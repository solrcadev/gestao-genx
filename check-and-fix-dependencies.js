const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Caminhos relativos
const nodeModulesPath = path.join(__dirname, 'node_modules');
const packageJsonPath = path.join(__dirname, 'package.json');

console.log('Verificando dependências duplicadas...');

// Verificar se existe mais de uma instância do React
function checkDuplicateReact() {
  const reactPaths = [
    path.join(nodeModulesPath, 'react'),
    path.join(nodeModulesPath, '@tanstack', 'react-query', 'node_modules', 'react'),
    // Adicione outros caminhos possíveis onde o React pode estar duplicado
  ];

  let foundInstances = [];

  reactPaths.forEach(reactPath => {
    if (fs.existsSync(reactPath)) {
      try {
        const packageJson = require(path.join(reactPath, 'package.json'));
        foundInstances.push({
          path: reactPath,
          version: packageJson.version,
        });
      } catch (err) {
        console.log(`Erro ao ler package.json em ${reactPath}:`, err.message);
      }
    }
  });

  return foundInstances;
}

// Verificar dependências duplicadas no node_modules
const duplicateReact = checkDuplicateReact();

if (duplicateReact.length > 1) {
  console.log('Múltiplas versões do React encontradas:');
  duplicateReact.forEach(instance => {
    console.log(`- ${instance.path} (versão ${instance.version})`);
  });

  console.log('\nCorrigindo dependências duplicadas...');
  
  // Executar comandos para corrigir o problema
  exec('npm dedupe', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar npm dedupe: ${error.message}`);
      return;
    }
    
    console.log('npm dedupe executado com sucesso');
    console.log(stdout);
    
    // Limpar node_modules e reinstalar
    console.log('Reinstalando dependências limpas...');
    exec('npm ci', (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao reinstalar dependências: ${error.message}`);
        return;
      }
      
      console.log('Dependências reinstaladas com sucesso');
      console.log('Verificando novamente...');
      
      const newDuplicateReact = checkDuplicateReact();
      if (newDuplicateReact.length > 1) {
        console.log('Ainda existem múltiplas versões do React:');
        newDuplicateReact.forEach(instance => {
          console.log(`- ${instance.path} (versão ${instance.version})`);
        });
        console.log('Pode ser necessário verificar as dependências manualmente.');
      } else {
        console.log('O problema foi resolvido com sucesso!');
      }
    });
  });
} else if (duplicateReact.length === 1) {
  console.log(`React encontrado em: ${duplicateReact[0].path} (versão ${duplicateReact[0].version})`);
  console.log('Não foram encontradas versões duplicadas do React.');
} else {
  console.log('Não foi possível encontrar o React nos caminhos verificados.');
} 