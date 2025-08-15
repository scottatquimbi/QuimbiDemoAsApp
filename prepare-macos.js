#!/usr/bin/env node

/**
 * Quimbi macOS Preparation Tool
 * 
 * This standalone executable prepares any macOS computer to run the Quimbi Support Assistant
 * by ensuring Ollama is installed and the required llama3.1:8b model is downloaded.
 * 
 * Usage: node prepare-macos.js
 * Or make executable: chmod +x prepare-macos.js && ./prepare-macos.js
 */

const { execSync, exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REQUIRED_MODEL = 'llama3.1:8b';
const OLLAMA_DOWNLOAD_URL = 'https://ollama.ai/download/mac';

class QuimbiPreparationTool {
  constructor() {
    this.isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    this.forceReinstall = process.argv.includes('--force');
  }

  log(message, isVerbose = false) {
    if (!isVerbose || this.isVerbose) {
      console.log(`🤖 ${message}`);
    }
  }

  error(message) {
    console.error(`❌ ERROR: ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  warning(message) {
    console.log(`⚠️  ${message}`);
  }

  /**
   * Check if Ollama is installed and accessible
   */
  async checkOllamaInstalled() {
    try {
      this.log('Checking if Ollama is installed...', true);
      execSync('which ollama', { stdio: 'pipe' });
      
      // Also check if it can run
      execSync('ollama --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Download and install Ollama for macOS
   */
  async installOllama() {
    this.log('Ollama not found. Installing Ollama for macOS...');
    
    try {
      // Check if we're on macOS
      const platform = process.platform;
      if (platform !== 'darwin') {
        throw new Error(`This installer is for macOS only. Detected platform: ${platform}`);
      }

      // Check for Homebrew first (easier installation)
      try {
        execSync('which brew', { stdio: 'pipe' });
        this.log('Found Homebrew. Installing Ollama via Homebrew...', true);
        execSync('brew install ollama', { stdio: 'inherit' });
        this.success('Ollama installed successfully via Homebrew');
        return true;
      } catch (brewError) {
        this.log('Homebrew not found, using manual installation...', true);
      }

      // Manual installation instructions
      this.warning('Manual installation required:');
      console.log('\nPlease follow these steps:');
      console.log('1. Open your web browser');
      console.log(`2. Go to: ${OLLAMA_DOWNLOAD_URL}`);
      console.log('3. Download the macOS installer');
      console.log('4. Run the installer');
      console.log('5. Restart your terminal/command prompt');
      console.log('6. Run this script again\n');
      
      // Wait for user confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('Have you completed the Ollama installation? (y/N): ', (answer) => {
          readline.close();
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            resolve(true);
          } else {
            this.error('Ollama installation cancelled. Please install Ollama and run this script again.');
            process.exit(1);
          }
        });
      });

    } catch (error) {
      this.error(`Failed to install Ollama: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if required model is available locally
   */
  async checkModelExists() {
    try {
      this.log(`Checking if model ${REQUIRED_MODEL} is available...`, true);
      const output = execSync('ollama list', { encoding: 'utf8', stdio: 'pipe' });
      return output.includes(REQUIRED_MODEL);
    } catch (error) {
      this.log(`Error checking models: ${error.message}`, true);
      return false;
    }
  }

  /**
   * Download the required model
   */
  async downloadModel() {
    return new Promise((resolve, reject) => {
      this.log(`Downloading model ${REQUIRED_MODEL}... This may take several minutes.`);
      this.log('Model size: ~4.7GB - please ensure you have sufficient disk space and internet bandwidth.', true);

      const downloadProcess = spawn('ollama', ['pull', REQUIRED_MODEL], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let progressOutput = '';
      let lastProgress = '';

      downloadProcess.stdout.on('data', (data) => {
        const output = data.toString();
        progressOutput += output;
        
        // Show progress updates (but not too frequently)
        const lines = output.split('\n').filter(line => line.trim());
        const latestLine = lines[lines.length - 1];
        if (latestLine && latestLine !== lastProgress) {
          if (latestLine.includes('pulling') || latestLine.includes('%') || latestLine.includes('downloading')) {
            process.stdout.write(`\r🔄 ${latestLine.trim()}`);
            lastProgress = latestLine;
          }
        }
      });

      downloadProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (this.isVerbose) {
          this.log(`Download stderr: ${output}`, true);
        }
      });

      downloadProcess.on('close', (code) => {
        process.stdout.write('\n'); // New line after progress
        if (code === 0) {
          this.success(`Model ${REQUIRED_MODEL} downloaded successfully`);
          resolve(true);
        } else {
          this.error(`Failed to download model ${REQUIRED_MODEL}. Exit code: ${code}`);
          reject(new Error(`Model download failed with exit code ${code}`));
        }
      });

      downloadProcess.on('error', (error) => {
        this.error(`Error downloading model: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Verify Ollama is running and responsive
   */
  async verifyOllamaWorking() {
    try {
      this.log('Verifying Ollama is working...', true);
      
      // Start Ollama service if not running
      try {
        execSync('curl -s http://localhost:11434/api/tags', { stdio: 'pipe' });
      } catch (error) {
        this.log('Starting Ollama service...', true);
        // Start Ollama in background
        spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' });
        
        // Wait a moment for it to start
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Test with a simple request
      const testResponse = execSync('curl -s http://localhost:11434/api/tags', { encoding: 'utf8' });
      const models = JSON.parse(testResponse);
      
      const hasRequiredModel = models.models.some(model => model.name.includes(REQUIRED_MODEL));
      if (!hasRequiredModel) {
        throw new Error(`Required model ${REQUIRED_MODEL} not found in Ollama`);
      }

      return true;
    } catch (error) {
      this.log(`Verification error: ${error.message}`, true);
      return false;
    }
  }

  /**
   * Display system information
   */
  displaySystemInfo() {
    if (!this.isVerbose) return;

    try {
      const arch = process.arch;
      const platform = process.platform;
      const nodeVersion = process.version;
      
      this.log('=== System Information ===', true);
      this.log(`Platform: ${platform}`, true);
      this.log(`Architecture: ${arch}`, true);
      this.log(`Node.js: ${nodeVersion}`, true);
      
      try {
        const macosVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
        this.log(`macOS Version: ${macosVersion}`, true);
      } catch (e) {
        // Not on macOS or command failed
      }
      
      this.log('========================\n', true);
    } catch (error) {
      // Ignore errors in system info display
    }
  }

  /**
   * Main preparation process
   */
  async prepare() {
    console.log('🤖 Quimbi macOS Preparation Tool');
    console.log('   Preparing your Mac to run Quimbi Support Assistant\n');

    this.displaySystemInfo();

    try {
      // Step 1: Check/Install Ollama
      const ollamaInstalled = await this.checkOllamaInstalled();
      if (!ollamaInstalled || this.forceReinstall) {
        const installSuccess = await this.installOllama();
        if (!installSuccess) {
          process.exit(1);
        }
        
        // Verify installation worked
        const verifyInstall = await this.checkOllamaInstalled();
        if (!verifyInstall) {
          this.error('Ollama installation verification failed. Please check the installation and try again.');
          process.exit(1);
        }
      } else {
        this.success('Ollama is already installed');
      }

      // Step 2: Check/Download Model
      const modelExists = await this.checkModelExists();
      if (!modelExists || this.forceReinstall) {
        await this.downloadModel();
      } else {
        this.success(`Model ${REQUIRED_MODEL} is already available`);
      }

      // Step 3: Verify everything works
      const verificationSuccess = await this.verifyOllamaWorking();
      if (!verificationSuccess) {
        this.error('System verification failed. Please check Ollama installation and try again.');
        process.exit(1);
      }

      // Success!
      console.log('\n🎉 Ready for Quimbi!');
      console.log('\nYour macOS system is now prepared to run the Quimbi Support Assistant.');
      console.log('You can now run the Quimbi Support Assistant.app');
      
      if (this.isVerbose) {
        console.log('\nInstalled components:');
        console.log(`- Ollama AI runtime`);
        console.log(`- ${REQUIRED_MODEL} language model`);
        console.log('- Ollama service configured and running');
      }

    } catch (error) {
      this.error(`Preparation failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Usage information
function showHelp() {
  console.log(`
🤖 Quimbi macOS Preparation Tool

Prepares your macOS system to run the Quimbi Support Assistant by installing
Ollama and downloading the required llama3.1:8b model.

Usage:
  node prepare-macos.js [options]

Options:
  --verbose, -v    Show detailed output
  --force          Force reinstallation even if components exist
  --help, -h       Show this help message

Examples:
  node prepare-macos.js
  node prepare-macos.js --verbose
  node prepare-macos.js --force --verbose

This tool will:
1. Check if Ollama is installed (install if missing)
2. Check if llama3.1:8b model exists (download if missing)
3. Verify everything is working correctly
4. Display "Ready for Quimbi!" when complete
`);
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const tool = new QuimbiPreparationTool();
  tool.prepare().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = QuimbiPreparationTool;