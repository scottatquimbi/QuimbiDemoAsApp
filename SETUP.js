#!/usr/bin/env node

/**
 * Quimbi AI - Universal Setup Script
 * Cross-platform Node.js script to install all dependencies
 * Usage: node SETUP.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(color + message + colors.reset);
}

function checkCommand(command) {
    try {
        execSync(`${command} --version`, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

function getPlatform() {
    const platform = os.platform();
    const arch = os.arch();
    
    return {
        platform,
        arch,
        isWindows: platform === 'win32',
        isMacOS: platform === 'darwin',
        isLinux: platform === 'linux'
    };
}

async function checkOllamaService() {
    const http = require('http');
    
    return new Promise((resolve) => {
        const req = http.get('http://localhost:11434/api/version', (res) => {
            resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function installOllamaModel(modelName) {
    log(`📥 Installing ${modelName} model...`, colors.blue);
    
    return new Promise((resolve) => {
        const process = spawn('ollama', ['pull', modelName], { 
            stdio: 'inherit',
            shell: true 
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                log(`✅ ${modelName} model installed successfully`, colors.green);
                resolve(true);
            } else {
                log(`❌ Failed to install ${modelName} model`, colors.red);
                resolve(false);
            }
        });
        
        process.on('error', (error) => {
            log(`❌ Error installing ${modelName}: ${error.message}`, colors.red);
            resolve(false);
        });
    });
}

async function main() {
    console.clear();
    
    log('===============================================', colors.cyan);
    log('    Game Support AI - Universal Setup', colors.bright);
    log('===============================================', colors.cyan);
    log('This script will install all required dependencies:', colors.yellow);
    log('- Node.js verification', colors.yellow);
    log('- Ollama (if not installed)', colors.yellow);
    log('- Required AI models (llama3.1:8b)', colors.yellow);
    log('- NPM dependencies for the project', colors.yellow);
    log('===============================================', colors.cyan);
    console.log('');
    
    const platform = getPlatform();
    log(`🖥️  Platform detected: ${platform.platform} (${platform.arch})`, colors.blue);
    console.log('');
    
    // Step 1: Check Node.js
    log('[1/4] Checking Node.js installation...', colors.bright);
    log('===============================================', colors.cyan);
    
    if (checkCommand('node')) {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        log(`✅ Node.js is already installed: ${nodeVersion}`, colors.green);
        
        // Check version
        const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
        if (majorVersion < 18) {
            log(`⚠️  Node.js version is too old (need v18+)`, colors.yellow);
            log('Please update Node.js from https://nodejs.org', colors.yellow);
        }
    } else {
        log('❌ This script requires Node.js to run, but Node.js is not installed!', colors.red);
        log('Please install Node.js from https://nodejs.org and run this script again.', colors.red);
        process.exit(1);
    }
    
    // Step 2: Check/Install Ollama
    console.log('');
    log('[2/4] Checking Ollama installation...', colors.bright);
    log('===============================================', colors.cyan);
    
    if (checkCommand('ollama')) {
        try {
            const ollamaVersion = execSync('ollama --version', { encoding: 'utf8' }).trim();
            log(`✅ Ollama is already installed: ${ollamaVersion}`, colors.green);
        } catch (error) {
            log('✅ Ollama is installed', colors.green);
        }
    } else {
        log('❌ Ollama not found. Please install it manually:', colors.red);
        log('', colors.reset);
        
        if (platform.isWindows) {
            log('Windows: Download and run OllamaSetup.exe from https://ollama.ai', colors.yellow);
        } else if (platform.isMacOS) {
            log('macOS: Run: curl -fsSL https://ollama.ai/install.sh | sh', colors.yellow);
            log('   Or: brew install ollama', colors.yellow);
        } else if (platform.isLinux) {
            log('Linux: Run: curl -fsSL https://ollama.ai/install.sh | sh', colors.yellow);
        }
        
        log('', colors.reset);
        log('After installing Ollama, please run this script again.', colors.yellow);
        process.exit(1);
    }
    
    // Step 3: Start Ollama and install models
    console.log('');
    log('[3/4] Starting Ollama service and installing AI models...', colors.bright);
    log('===============================================', colors.cyan);
    
    // Start Ollama service
    log('Starting Ollama service...', colors.blue);
    
    let ollamaProcess;
    try {
        if (platform.isWindows) {
            ollamaProcess = spawn('ollama', ['serve'], { 
                detached: true, 
                stdio: 'ignore',
                shell: true 
            });
        } else {
            ollamaProcess = spawn('ollama', ['serve'], { 
                detached: true, 
                stdio: 'ignore' 
            });
            ollamaProcess.unref();
        }
    } catch (error) {
        log('⚠️  Could not start Ollama service automatically', colors.yellow);
        log('Please run "ollama serve" in another terminal', colors.yellow);
    }
    
    // Wait for service to start
    log('Waiting for Ollama service to start...', colors.blue);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if service is running
    const isOllamaRunning = await checkOllamaService();
    if (isOllamaRunning) {
        log('✅ Ollama service is running', colors.green);
    } else {
        log('⚠️  Could not connect to Ollama service', colors.yellow);
        log('Please make sure "ollama serve" is running in another terminal', colors.yellow);
        log('Continuing with model installation anyway...', colors.yellow);
    }
    
    // Install models
    console.log('');
    log('Installing required AI models (this may take several minutes)...', colors.blue);
    log('This will download several GB of data, please be patient...', colors.yellow);
    console.log('');
    
    const models = ['llama3.1:8b'];
    for (const model of models) {
        await installOllamaModel(model);
        console.log('');
    }
    
    // Step 4: Check system dependencies
    console.log('');
    log('[4/6] Checking system dependencies...', colors.bright);
    log('===============================================', colors.cyan);
    
    const systemDeps = ['curl', 'git'];
    const missingDeps = [];
    
    for (const dep of systemDeps) {
        if (checkCommand(dep)) {
            log(`✅ ${dep} is available`, colors.green);
        } else {
            log(`❌ ${dep} is missing`, colors.red);
            missingDeps.push(dep);
        }
    }
    
    if (missingDeps.length > 0) {
        log('', colors.reset);
        log('Please install missing system dependencies:', colors.yellow);
        
        if (platform.isWindows) {
            log('Windows: Install Git from https://git-scm.com (includes curl)', colors.yellow);
        } else if (platform.isMacOS) {
            log('macOS: Install Xcode Command Line Tools: xcode-select --install', colors.yellow);
        } else {
            log('Linux: sudo apt install curl git (Ubuntu/Debian)', colors.yellow);
            log('       sudo dnf install curl git (Fedora)', colors.yellow);
        }
        
        log('After installing dependencies, please run this script again.', colors.yellow);
    }

    // Step 5: Install NPM dependencies
    console.log('');
    log('[5/6] Installing NPM dependencies...', colors.bright);
    log('===============================================', colors.cyan);
    
    if (fs.existsSync('package.json')) {
        log('📦 Installing project dependencies...', colors.blue);
        try {
            execSync('npm install', { stdio: 'inherit' });
            log('✅ NPM dependencies installed successfully', colors.green);
            
            // Verify critical dependencies
            const criticalDeps = ['react-markdown', 'ai', 'ollama'];
            log('Verifying critical dependencies...', colors.blue);
            
            for (const dep of criticalDeps) {
                try {
                    require.resolve(`${dep}/package.json`);
                    log(`✅ ${dep} is available`, colors.green);
                } catch (error) {
                    log(`⚠️  ${dep} may not be properly installed`, colors.yellow);
                }
            }
            
        } catch (error) {
            log('❌ Failed to install NPM dependencies', colors.red);
            log('You may need to run: npm install manually', colors.yellow);
        }
    } else {
        log('⚠️  package.json not found in current directory', colors.yellow);
        log('Make sure you\'re running this script from the project root', colors.yellow);
    }
    
    // Step 6: Final verification
    console.log('');
    log('[6/6] Final system verification...', colors.bright);
    log('===============================================', colors.cyan);
    
    let allGood = true;
    
    // Check Node.js version
    if (checkCommand('node')) {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
        if (majorVersion >= 18) {
            log(`✅ Node.js ${nodeVersion} (sufficient)`, colors.green);
        } else {
            log(`❌ Node.js ${nodeVersion} (need v18+)`, colors.red);
            allGood = false;
        }
    } else {
        log('❌ Node.js not found', colors.red);
        allGood = false;
    }
    
    // Check npm
    if (checkCommand('npm')) {
        log('✅ npm is available', colors.green);
    } else {
        log('❌ npm not found', colors.red);
        allGood = false;
    }
    
    // Check Ollama
    if (checkCommand('ollama')) {
        log('✅ Ollama is available', colors.green);
    } else {
        log('❌ Ollama not found', colors.red);
        allGood = false;
    }
    
    if (!allGood) {
        log('', colors.reset);
        log('⚠️  Some required dependencies are missing.', colors.yellow);
        log('Please resolve the issues above and run the script again.', colors.yellow);
    }
    
    // Completion
    console.log('');
    log('===============================================', colors.cyan);
    log('             SETUP COMPLETE! 🎉', colors.green + colors.bright);
    log('===============================================', colors.cyan);
    console.log('');
    log('All components have been set up:', colors.green);
    
    if (checkCommand('node')) {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        log(`✅ Node.js ${nodeVersion}`, colors.green);
    }
    
    log('✅ Ollama', colors.green);
    log('✅ AI Models (llama3.1:8b)', colors.green);
    log('✅ NPM Dependencies', colors.green);
    console.log('');
    
    log('You can now run the demo by:', colors.blue);
    
    if (platform.isWindows) {
        log('1. Double-clicking START_DEMO.bat', colors.yellow);
    } else {
        log('1. Double-clicking START_DEMO.sh', colors.yellow);
    }
    
    log('2. Or running: npm run demo', colors.yellow);
    console.log('');
    log('The demo will be available at: http://localhost:3000', colors.bright);
    console.log('');
    
    // Show model list
    try {
        log('Installed Ollama models:', colors.blue);
        execSync('ollama list', { stdio: 'inherit' });
    } catch (error) {
        log('Could not list models - make sure Ollama is running', colors.yellow);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    log('\n\nSetup interrupted by user', colors.yellow);
    process.exit(0);
});

// Run the setup
main().catch(error => {
    log(`\n❌ Setup failed: ${error.message}`, colors.red);
    process.exit(1);
});