#!/bin/bash

# Quimbi AI Demo Launcher
# To make this script executable, open Terminal in this folder and run:
# chmod +x START_DEMO.sh
# Then you can run it with: ./START_DEMO.sh

clear
echo "==============================================="
echo "       Quimbi AI Demo Launcher v3.0"
echo "==============================================="
echo ""
echo "🎉 LATEST FEATURES:"
echo "  📋 Three-part response system (Summary → Solution → Compensation)"
echo "  🎫 Automated ticket generation with unique IDs"
echo "  ⚡ Immediate CRM trigger (no user response wait)"
echo "  📊 Professional third-person case reports"
echo "  🎭 Context-aware responses with player details"
echo "  🔧 Enhanced AI response parsing and duplication prevention"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed"
    echo "Please install npm or use Node.js installer from https://nodejs.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Ollama is running
echo "🔍 Checking if Ollama is running..."
if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "⚠️  WARNING: Ollama is not running or not accessible at localhost:11434"
    echo "Please make sure Ollama is installed and running:"
    echo "  1. Install Ollama from https://ollama.ai"
    echo "  2. Run: ollama serve"
    echo "  3. Run: ollama pull llama3.1:8b"
    echo ""
    echo "Continuing anyway... the demo will show connection errors if Ollama is not available"
    echo ""
    sleep 3
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to install dependencies"
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Quimbi AI Demo..."
echo "The demo will open automatically in your default browser"
echo "Press Ctrl+C in the terminal to stop the server when you're done"
echo ""

# Start the development server in the background (without turbo to avoid chunk errors)
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Open browser
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000
else
    echo "🌐 Please open your browser and go to: http://localhost:3000"
fi

echo ""
echo "✨ Demo is running at: http://localhost:3000"
echo ""
echo "💡 Try the latest features:"
echo "  • Notice the professional case analysis popup"
echo "  • Experience the three-part response workflow"
echo "  • See automated ticket generation and immediate CRM completion"
echo "  • Observe context-aware responses using player details"
echo ""
echo "Press Ctrl+C to stop the server, or close this terminal window"

# Wait for the server process
wait $SERVER_PID