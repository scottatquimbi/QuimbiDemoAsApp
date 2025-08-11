#!/bin/bash

# Quimbi AI - Linux Setup Script
# To make this script executable, open Terminal in this folder and run:
# chmod +x SETUP_LINUX.sh
# Then you can run it with: ./SETUP_LINUX.sh

set -e  # Exit on any error

clear
echo "==============================================="
echo "       Quimbi AI - Linux Setup"
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

# Function to detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    elif type lsb_release >/dev/null 2>&1; then
        lsb_release -si | tr '[:upper:]' '[:lower:]'
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        echo $DISTRIB_ID | tr '[:upper:]' '[:lower:]'
    else
        echo "unknown"
    fi
}

# Function to install Node.js based on distribution
install_nodejs() {
    DISTRO=$(detect_distro)
    echo "Detected Linux distribution: $DISTRO"
    
    case $DISTRO in
        ubuntu|debian)
            echo "Installing Node.js on Ubuntu/Debian..."
            # Update package list
            sudo apt update
            
            # Install Node.js 18.x
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        fedora|centos|rhel)
            echo "Installing Node.js on Fedora/CentOS/RHEL..."
            # Install Node.js 18.x
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo dnf install -y nodejs npm
            ;;
        arch|manjaro)
            echo "Installing Node.js on Arch Linux..."
            sudo pacman -S --noconfirm nodejs npm
            ;;
        opensuse*)
            echo "Installing Node.js on openSUSE..."
            sudo zypper install -y nodejs18 npm18
            ;;
        *)
            echo "Unsupported distribution: $DISTRO"
            echo "Please install Node.js manually from https://nodejs.org"
            echo "Or use your distribution's package manager"
            exit 1
            ;;
    esac
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
        install_nodejs
    fi
else
    echo "❌ Node.js not found. Installing Node.js..."
    install_nodejs
    
    # Verify installation
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js installed successfully: $NODE_VERSION"
    else
        echo "❌ Node.js installation failed"
        echo "Please install Node.js manually from https://nodejs.org"
        exit 1
    fi
fi

# Check npm
if ! command_exists npm; then
    echo "❌ npm not found. This should have been installed with Node.js"
    echo "Please reinstall Node.js or install npm separately"
    exit 1
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
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Add Ollama to PATH if needed
    if ! command_exists ollama; then
        echo "Adding Ollama to PATH..."
        echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
        export PATH=$PATH:/usr/local/bin
    fi
    
    # Verify installation
    if command_exists ollama; then
        echo "✅ Ollama installed successfully"
    else
        echo "❌ Ollama installation failed"
        echo "Please install Ollama manually from https://ollama.ai"
        echo "Or check if it's in your PATH"
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
echo "This will download several GB of data, please be patient..."
echo ""

echo "📥 Installing llama3.1:8b model..."
if ollama pull llama3.1:8b; then
    echo "✅ llama3.1:8b model installed successfully"
else
    echo "❌ Failed to install llama3.1:8b model"
    echo "You can try installing it manually later with: ollama pull llama3.1:8b"
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
    DISTRO=$(detect_distro)
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt update
            sudo apt install -y $MISSING_DEPS
            ;;
        fedora|centos|rhel)
            sudo dnf install -y $MISSING_DEPS
            ;;
        arch|manjaro)
            sudo pacman -S --noconfirm $MISSING_DEPS
            ;;
        opensuse*)
            sudo zypper install -y $MISSING_DEPS
            ;;
        *)
            echo "Please install manually: $MISSING_DEPS"
            ;;
    esac
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
        echo "You may need to run: sudo npm install --unsafe-perm=true --allow-root"
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
echo "1. Running: ./START_DEMO.sh"
echo "2. Or running: npm run demo"
echo ""
echo "The demo will be available at: http://localhost:3000"
echo ""

# Keep Ollama running in background
echo "Note: Ollama service is running in the background (PID: $OLLAMA_PID)"
echo "You can stop it later with: kill $OLLAMA_PID"
echo ""

# Check installed models
echo "Checking installed Ollama models..."
ollama list || echo "Could not list models - make sure Ollama is running"
echo ""

read -p "Press Enter to continue..."