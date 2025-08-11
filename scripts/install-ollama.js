#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Required models for the application
const REQUIRED_MODELS = [
  'llama3.1:8b'
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if Ollama is installed and available
function checkOllamaInstalled() {
  return new Promise((resolve) => {
    exec('ollama --version', (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        log(`✓ Ollama found: ${stdout.trim()}`, 'green');
        resolve(true);
      }
    });
  });
}

// Check if Ollama service is running
function checkOllamaRunning() {
  return new Promise((resolve) => {
    exec('curl -s http://localhost:11434/api/tags', (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        try {
          JSON.parse(stdout);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      }
    });
  });
}

// Install Ollama based on platform
function installOllama() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    log(`Installing Ollama for ${platform}...`, 'blue');
    
    let installCommand;
    
    switch (platform) {
      case 'darwin': // macOS
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
        break;
      case 'linux':
        installCommand = 'curl -fsSL https://ollama.ai/install.sh | sh';
        break;
      case 'win32': // Windows
        log('Please download and install Ollama manually from: https://ollama.ai/download', 'yellow');
        log('After installation, run: npm run postinstall', 'yellow');
        resolve();
        return;
      default:
        reject(new Error(`Unsupported platform: ${platform}`));
        return;
    }
    
    exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        log(`Installation failed: ${error.message}`, 'red');
        reject(error);
      } else {
        log('✓ Ollama installed successfully', 'green');
        resolve();
      }
    });
  });
}

// Start Ollama service in background
function startOllama() {
  return new Promise((resolve, reject) => {
    log('Starting Ollama service...', 'blue');
    
    const ollamaProcess = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    
    ollamaProcess.unref();
    
    // Wait a moment for service to start
    setTimeout(async () => {
      const isRunning = await checkOllamaRunning();
      if (isRunning) {
        log('✓ Ollama service started', 'green');
        resolve();
      } else {
        log('Service may already be running or starting in background', 'yellow');
        resolve(); // Don't fail, continue with model downloads
      }
    }, 3000);
  });
}

// Download a specific model
function downloadModel(modelName) {
  return new Promise((resolve, reject) => {
    log(`Downloading model: ${modelName}...`, 'blue');
    log('This may take several minutes depending on your internet connection', 'yellow');
    
    const pullProcess = spawn('ollama', ['pull', modelName], {
      stdio: 'inherit'
    });
    
    pullProcess.on('close', (code) => {
      if (code === 0) {
        log(`✓ Successfully downloaded: ${modelName}`, 'green');
        resolve();
      } else {
        log(`✗ Failed to download: ${modelName}`, 'red');
        reject(new Error(`Failed to download ${modelName}`));
      }
    });
    
    pullProcess.on('error', (error) => {
      log(`✗ Error downloading ${modelName}: ${error.message}`, 'red');
      reject(error);
    });
  });
}

// Check if a model is already downloaded
function checkModelExists(modelName) {
  return new Promise((resolve) => {
    exec('ollama list', (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        const modelExists = stdout.includes(modelName.split(':')[0]);
        resolve(modelExists);
      }
    });
  });
}

// Download all required models
async function downloadRequiredModels() {
  log('Checking for required AI models...', 'blue');
  
  for (const model of REQUIRED_MODELS) {
    const exists = await checkModelExists(model);
    if (exists) {
      log(`✓ Model already exists: ${model}`, 'green');
    } else {
      try {
        await downloadModel(model);
      } catch (error) {
        log(`Warning: Could not download ${model}. You may need to download it manually later.`, 'yellow');
        log(`Run: ollama pull ${model}`, 'yellow');
      }
    }
  }
}

// Main installation process
async function main() {
  try {
    log('🎮 Game Support AI Assistant - Setup', 'blue');
    log('=================================', 'blue');
    
    // Check if Ollama is already installed
    const isInstalled = await checkOllamaInstalled();
    
    if (!isInstalled) {
      log('Ollama not found. Installing...', 'yellow');
      await installOllama();
    }
    
    // Check if Ollama service is running
    const isRunning = await checkOllamaRunning();
    
    if (!isRunning) {
      await startOllama();
      // Wait a bit more after starting
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      log('✓ Ollama service is running', 'green');
    }
    
    // Download required models
    await downloadRequiredModels();
    
    log('', 'reset');
    log('🎉 Setup completed successfully!', 'green');
    log('You can now run the application with: npm run electron-dev', 'blue');
    log('', 'reset');
    
  } catch (error) {
    log('', 'reset');
    log('❌ Setup failed:', 'red');
    log(error.message, 'red');
    log('', 'reset');
    log('Manual setup instructions:', 'yellow');
    log('1. Install Ollama from: https://ollama.ai/download', 'yellow');
    log('2. Start Ollama: ollama serve', 'yellow');
    log('3. Download models:', 'yellow');
    REQUIRED_MODELS.forEach(model => {
      log(`   ollama pull ${model}`, 'yellow');
    });
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkOllamaInstalled,
  checkOllamaRunning,
  installOllama,
  downloadRequiredModels,
  REQUIRED_MODELS
};