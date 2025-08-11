# 🎮 Quimbi AI Demo - Quick Start

## 🚀 SUPER EASY: One-Click Installation (Installs Everything!)

### Windows Users
1. **Double-click** `INSTALL_EVERYTHING.bat` - This installs ALL prerequisites automatically!
2. After setup completes, **double-click** `START_DEMO.bat` to run the demo
3. The demo will be available at http://localhost:3000

### Mac/Linux Users  
1. **Double-click** `INSTALL_EVERYTHING.sh` - This installs ALL prerequisites automatically!
2. After setup completes, **double-click** `START_DEMO.sh` to run the demo
3. The demo will be available at http://localhost:3000

---

## 🛠️ Manual Installation (If You Prefer)

If you want to install prerequisites manually or the one-click installer doesn't work:

### Option 1: Platform-Specific Installers
- **Windows**: Double-click `SETUP_WINDOWS.bat`
- **macOS**: Double-click `SETUP_MACOS.sh`  
- **Linux**: Double-click `SETUP_LINUX.sh`

### Option 2: Universal Installer (Requires Node.js)
```bash
node SETUP.js
```

### Option 3: Manual Installation
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org
   - Choose the LTS (Long Term Support) version

2. **Ollama** with required model
   - Install Ollama: https://ollama.ai
   - After installation, run these commands:
   ```bash
   ollama serve
   ollama pull llama3.1:8b
   ```

---

## 📋 Alternative Methods

### Method 1: Command Line
```bash
npm run demo
```

### Method 2: Manual Steps
```bash
npm install          # Install dependencies (first time only)
npm run dev         # Start the server
```
Then open http://localhost:3000 in your browser

---

## 🎯 What You'll See

The demo showcases an AI-powered customer support system for a Game of Thrones mobile game:

- **Automated Support Flow**: Complete intake form system with AI-powered routing and intelligent escalation
- **Model Persistence**: llama3.1 stays loaded for instant responses across all interactions
- **Player Context Panel**: Shows player information, VIP status, spending history
- **AI Chat Interface**: Context-aware responses using local llama3.1 model exclusively
- **Three-Part Response System**: Problem summary → Solution → Compensation (if needed)
- **Seamless Escalation**: Problem descriptions automatically transfer from automated support to human chat
- **Compensation Workflow**: AI detects issues and recommends appropriate compensation
- **Agent Tools**: Approval workflow for compensation decisions with immediate CRM completion

---

## ❓ Troubleshooting

### Browser doesn't open automatically?
- Go to: http://localhost:3000

### "Ollama connection error"?
- Make sure Ollama is running: `ollama serve`
- Verify model is installed: `ollama list`
- Install required model: `ollama pull llama3.1:8b`

### Port 3000 already in use?
- Stop other applications using port 3000
- Or the script will automatically try the next available port

### Dependencies not installing?
- Make sure you have Node.js installed
- Try running: `npm install` manually
- Check your internet connection

---

## 🛑 How to Stop

- **Windows**: Press `Ctrl+C` in the command window, or close the window
- **Mac/Linux**: Press `Ctrl+C` in the terminal, or close the terminal

---

## 📞 Support

If you encounter issues:
1. Check that all prerequisites are installed
2. Verify Ollama is running with the required model (llama3.1:8b)
3. Try restarting both Ollama and the demo

---

## 🎮 Demo Features

- **JonSnow123**: Tutorial crash scenario (new player) - tests automated support flow and escalation
- **DanyStormborn**: Alliance event rewards issue (deception detection) - tests three-part response workflow
- **LannisterGold**: Account access problem (VIP player) - tests priority handling and immediate CRM completion
- **Custom scenarios**: Edit player context to test different situations
- **Automated Support**: Visit `/automated-support` to test the complete intake form and escalation system

---

*Powered by Ollama (llama3.1:8b exclusively), Next.js, and local AI processing - no external API keys required!*