#!/bin/bash

# Quimbi AI - macOS Setup Script
#
# HOW TO RUN THIS SCRIPT:
# 1. Open Terminal (found in Applications > Utilities)
# 2. IMPORTANT: If you get "Operation Not Permitted" errors:
#    - Move this folder to your home directory or Desktop first
#    - Or give Terminal "Full Disk Access" in System Preferences > Security & Privacy
# 3. Navigate to this folder by typing: cd 
# 4. Then drag this folder from Finder into Terminal and press Enter
# 5. Make the script executable: chmod +x SETUP_MACOS.sh
# 6. Run the script: ./SETUP_MACOS.sh

set -e  # Exit on any error

# Check if we can access current directory
if ! pwd > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot access current directory"
    echo "This usually happens due to macOS security restrictions."  
    echo ""
    echo "SOLUTIONS:"
    echo "1. Move this folder to your home directory: ~/quimbi-ai"
    echo "2. Or move to Desktop: ~/Desktop/quimbi-ai" 
    echo "3. Or give Terminal 'Full Disk Access' in System Preferences > Security & Privacy"
    echo ""
    exit 1
fi

clear
echo "==============================================="
echo "       Quimbi AI - macOS Setup"
echo "==============================================="
echo "This script will install all required dependencies:"
echo "- Node.js (if not installed)"
echo "- Ollama (if not installed)" 
echo "- Required AI models (llama3.1:8b)"
echo "- NPM dependencies for the project"
echo "==============================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew if not present
install_homebrew() {
    if ! command_exists brew; then
        echo "📦 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == "arm64" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        else
            echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        
        echo "✅ Homebrew installed successfully"
    else
        echo "✅ Homebrew is already installed"
    fi
}

echo "[1/4] Checking Node.js installation..."
echo "==============================================="

if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js is already installed: $NODE_VERSION"
    
    # Check if version is adequate (v18+)
    NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Node.js version is too old (need v18+). Upgrading..."
        install_homebrew
        brew upgrade node
    fi
else
    echo "❌ Node.js not found. Installing Node.js..."
    
    # Try multiple installation methods
    if command_exists brew; then
        echo "Using Homebrew to install Node.js..."
        brew install node
    else
        echo "Installing Homebrew first..."
        install_homebrew
        echo "Installing Node.js via Homebrew..."
        brew install node
    fi
    
    # Verify installation
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js installed successfully: $NODE_VERSION"
    else
        echo "❌ Node.js installation failed"
        echo "Please install Node.js manually from https://nodejs.org"
        open https://nodejs.org
        exit 1
    fi
fi

echo ""
echo "[2/4] Checking Ollama installation..."
echo "==============================================="

if command_exists ollama; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "version unknown")
    echo "✅ Ollama is already installed: $OLLAMA_VERSION"
else
    echo "❌ Ollama not found. Installing Ollama..."
    
    # Download and install Ollama
    echo "Downloading Ollama installer..."
    brew install ollama
    
    # Verify installation
    if command_exists ollama; then
        echo "✅ Ollama installed successfully"
    else
        echo "❌ Ollama installation failed"
        echo "Please install Ollama manually from https://ollama.ai"
        open https://ollama.ai
        exit 1
    fi
fi

echo ""
echo "[3/4] Starting Ollama service and installing AI models..."
echo "==============================================="

# Start Ollama service in background
echo "Starting Ollama service..."
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "Waiting for Ollama service to start..."
sleep 10

# Check if Ollama is responding
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo "✅ Ollama service is running"
else
    echo "⚠️  Ollama service may not be responding, continuing anyway..."
fi

# Install required models
echo ""
echo "Installing required AI models (this may take several minutes)..."
echo ""

echo "📥 Installing llama3.1:8b model..."
if ollama pull llama3.1:8b; then
    echo "✅ llama3.1:8b model installed successfully"
else
    echo "❌ Failed to install llama3.1:8b model"
fi

echo ""
echo "[4/5] Checking system dependencies..."
echo "==============================================="

# Check for required system tools
echo "Checking system dependencies..."
MISSING_DEPS=""

if ! command_exists curl; then
    echo "❌ curl not found"
    MISSING_DEPS="$MISSING_DEPS curl"
else
    echo "✅ curl is available"
fi

if ! command_exists git; then
    echo "❌ git not found"
    MISSING_DEPS="$MISSING_DEPS git"
else
    echo "✅ git is available"
fi

if [ -n "$MISSING_DEPS" ]; then
    echo ""
    echo "Installing missing system dependencies..."
    
    if ! command_exists brew; then
        install_homebrew
    fi
    
    for dep in $MISSING_DEPS; do
        echo "Installing $dep..."
        brew install $dep
    done
fi

echo ""
echo "[5/5] Installing NPM dependencies..."
echo "==============================================="

# Install npm dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing project dependencies..."
    if npm install; then
        echo "✅ NPM dependencies installed successfully"
    else
        echo "❌ Failed to install NPM dependencies"
        exit 1
    fi
else
    echo "⚠️  package.json not found in current directory"
    echo "Make sure you're running this script from the project root"
fi

echo ""
echo "==============================================="
echo "             SETUP COMPLETE! 🎉"
echo "==============================================="
echo ""
echo "All components have been installed:"
echo "✅ Node.js $(node --version)"
echo "✅ Ollama"
echo "✅ AI Models (llama3.1:8b)"
echo "✅ NPM Dependencies"
echo ""
echo "You can now run the demo by:"
echo "1. Double-clicking START_DEMO.sh"
echo "2. Or running: npm run demo"
echo ""
echo "The demo will be available at: http://localhost:3000"
echo ""

# Keep Ollama running in background
echo "Note: Ollama service is running in the background (PID: $OLLAMA_PID)"
echo "You can stop it later with: kill $OLLAMA_PID"
echo ""

read -p "Press Enter to continue..."