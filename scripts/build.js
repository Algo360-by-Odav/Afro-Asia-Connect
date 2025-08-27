#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Pre-build setup starting...');

// Check if TypeScript is installed
try {
  execSync('npx tsc --version', { stdio: 'pipe' });
  console.log('✅ TypeScript is available');
} catch (error) {
  console.log('⚠️ TypeScript not found, installing...');
  try {
    execSync('npm install typescript @types/node @types/react @types/react-dom', { stdio: 'inherit' });
    console.log('✅ TypeScript dependencies installed');
  } catch (installError) {
    console.error('❌ Failed to install TypeScript dependencies:', installError.message);
    process.exit(1);
  }
}

// Check if tsconfig.json exists
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  console.error('❌ tsconfig.json not found');
  process.exit(1);
}

console.log('✅ Pre-build setup complete');

// Run the actual build
console.log('🚀 Starting Next.js build...');
try {
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (buildError) {
  console.error('❌ Build failed:', buildError.message);
  process.exit(1);
}
