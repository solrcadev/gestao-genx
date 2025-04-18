const fs = require('fs');
const path = require('path');

// Função para procurar por todas as instâncias do React no node_modules
function findReactInstances(directory = 'node_modules') {
  const reactInstances = [];
  const baseDir = path.resolve(directory);
  
  if (!fs.existsSync(baseDir)) {
    console.log(`Diretório ${baseDir} não encontrado.`);
    return reactInstances;
  }

  // Função recursiva para procurar em todos os subdiretórios
  function searchInDirectory(dir, depth = 0) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Se for um diretório
      if (entry.isDirectory()) {
        // Se for o próprio react
        if (entry.name === 'react' && depth > 0) {
          try {
            const packageJsonPath = path.join(fullPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              reactInstances.push({
                path: fullPath,
                version: packageJson.version
              });
            }
          } catch (error) {
            console.error(`Erro ao ler package.json em ${fullPath}:`, error);
          }
        }
        
        // Não entrar em node_modules aninhados além do primeiro nível para evitar loops
        if (entry.name !== 'node_modules' || depth === 0) {
          searchInDirectory(fullPath, depth + 1);
        }
      }
    }
  }
  
  searchInDirectory(baseDir);
  return reactInstances;
}

// Encontrar todas as instâncias do React
const reactInstances = findReactInstances();

if (reactInstances.length === 0) {
  console.log('Nenhuma instância do React encontrada.');
} else if (reactInstances.length === 1) {
  console.log(`Uma instância do React encontrada: ${reactInstances[0].path} (versão ${reactInstances[0].version})`);
} else {
  console.log(`Encontradas ${reactInstances.length} instâncias do React:`);
  reactInstances.forEach((instance, index) => {
    console.log(`${index + 1}. ${instance.path} (versão ${instance.version})`);
  });
  
  console.log('\nMúltiplas versões do React podem causar problemas com hooks. Recomendações:');
  console.log('1. Execute: npm dedupe');
  console.log('2. Se persistir, limpe os módulos e reinstale: rm -rf node_modules && npm install');
  console.log('3. Se ainda persistir, use npm link para garantir uma única versão do React.');
}

// Verificar também o react-dom
const reactDomInstances = findReactInstances('node_modules').filter(
  instance => instance.path.includes('react-dom')
);

if (reactDomInstances.length > 1) {
  console.log(`\nEncontradas ${reactDomInstances.length} instâncias do React DOM:`);
  reactDomInstances.forEach((instance, index) => {
    console.log(`${index + 1}. ${instance.path} (versão ${instance.version})`);
  });
}

// Verificar hoisting de dependências
console.log('\nVerificando hoisting de dependências do React...');
const depsWithReact = findReactInstances().filter(
  instance => instance.path.includes('node_modules/') && 
  instance.path.split('node_modules/').length > 2
);

if (depsWithReact.length > 0) {
  console.log('Dependências com sua própria cópia do React:');
  depsWithReact.forEach(dep => {
    console.log(`- ${dep.path} (versão ${dep.version})`);
  });
}

// Sugestão para resolver
console.log('\nPara resolver problemas de múltiplas instâncias do React:');
console.log('1. Adicione as seguintes linhas ao seu package.json na seção "resolutions":');
console.log(`
"resolutions": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
`);
console.log('2. Execute: npm install ou yarn install');
console.log('3. Verifique se seu webpack ou vite estão configurados para usar alias para o React'); 