
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Starting React dependency fix script...');

// Check if we have multiple React instances
function findMultipleReactInstances() {
  try {
    console.log('Checking for multiple React instances...');
    
    const output = execSync('npm ls react').toString();
    const lines = output.split('\n');
    
    // Count instances of react
    const reactInstances = lines.filter(line => line.includes('react@')).length;
    
    console.log(`Found ${reactInstances} React instance(s)`);
    
    return reactInstances > 1;
  } catch (error) {
    console.log('Error checking React instances, assuming potential duplicates');
    return true;
  }
}

// Main execution
if (findMultipleReactInstances()) {
  console.log('⚠️ Multiple React instances detected, fixing...');
  
  try {
    console.log('Running npm dedupe to deduplicate React dependencies...');
    execSync('npm dedupe', { stdio: 'inherit' });
    
    console.log('Creating temporary package.json backup...');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonBackupPath = path.join(process.cwd(), 'package.json.backup');
    
    fs.copyFileSync(packageJsonPath, packageJsonBackupPath);
    
    console.log('Updating package.json to ensure React version consistency...');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ensure we have a resolutions field
    packageJson.resolutions = packageJson.resolutions || {};
    
    // Set React versions to be consistent
    packageJson.resolutions['react'] = '^18.2.0';
    packageJson.resolutions['react-dom'] = '^18.2.0';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Running npm install to apply changes...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('✅ React dependency fix complete!');
    console.log('Please restart your development server.');
  } catch (error) {
    console.error('❌ Error fixing React dependencies:', error.message);
    console.log('Please try manually:');
    console.log('1. npm dedupe');
    console.log('2. Add resolutions for react and react-dom in package.json');
    console.log('3. npm install');
  }
} else {
  console.log('✅ No duplicate React instances found, your setup looks good!');
}
