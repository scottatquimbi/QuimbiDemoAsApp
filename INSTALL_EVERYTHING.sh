#!/bin/bash

# Quimbi AI - One-Click Setup for Mac/Linux
# To make this script executable, open Terminal in this folder and run:
# chmod +x INSTALL_EVERYTHING.sh
# Then you can run it with: ./INSTALL_EVERYTHING.sh

clear
echo "==============================================="
echo "      Quimbi AI - One-Click Setup"
echo "==============================================="
echo ""
echo "This will install everything you need:"
echo "- Node.js (if missing)"
echo "- Ollama AI platform"
echo "- Required AI models"
echo "- Project dependencies"
echo ""
echo "Choose your installation method:"
echo ""
echo "[1] Platform-specific installer (recommended)"
echo "[2] Universal Node.js installer" 
echo "[3] Exit"
echo ""

read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo "Running platform-specific setup..."
        
        # Detect platform and run appropriate script
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Detected macOS - running macOS setup..."
            ./SETUP_MACOS.sh
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Detected Linux - running Linux setup..."
            ./SETUP_LINUX.sh
        else
            echo "Unknown platform: $OSTYPE"
            echo "Falling back to universal setup..."
            node SETUP.js
        fi
        ;;
    2)
        echo ""
        echo "Running universal Node.js setup..."
        if command -v node >/dev/null 2>&1; then
            node SETUP.js
        else
            echo "Universal setup requires Node.js to be installed first."
            echo "Falling back to platform-specific setup..."
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                ./SETUP_MACOS.sh
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                ./SETUP_LINUX.sh
            else
                echo "Please install Node.js manually from https://nodejs.org"
                exit 1
            fi
        fi
        ;;
    3)
        echo ""
        echo "Setup cancelled."
        exit 0
        ;;
    *)
        echo ""
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "Setup complete! You can now run the demo."