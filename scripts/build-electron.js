#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building Game Support AI Assistant for Electron...');
console.log('================================================\n');

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', reject);
  });
}

async function build() {
  try {
    // Step 1: Build Next.js application with standalone output
    console.log('📦 Step 1: Building Next.js application for standalone deployment...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Next.js build with standalone output complete\n');
    
    // Step 2: Verify standalone directory exists
    const standaloneDir = path.join(process.cwd(), '.next/standalone');
    if (!fs.existsSync(standaloneDir)) {
      throw new Error('Standalone directory not found. Build may have failed.');
    }
    
    console.log('🎉 Electron build preparation complete!');
    console.log('📁 Standalone server is ready in: ./.next/standalone/');
    console.log('📁 Static assets are in: ./.next/static/');
    console.log('\nNext steps:');
    console.log('  Run: npm run electron-build  (to package as desktop app)');
    console.log('  Or:  npm run electron        (to test in development)');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();