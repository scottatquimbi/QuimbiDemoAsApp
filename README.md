# Quimbi AI

A local AI-powered support system for Game of Thrones players, featuring:

- **Pure Ollama-based AI processing** using llama3.1 exclusively for all functions
- **Model persistence system** keeps llama3.1 loaded for instant responses
- **Automated support flow** with AI-powered intake forms and intelligent routing
- **Seamless escalation** from automated support to human chat with full context transfer
- **Context-aware responses** based on player profile and game progress  
- **Intelligent issue detection** with automatic compensation recommendations
- **Admin panel** for support agents to manage requests
- **Interactive demo scenarios** showcasing different player support cases
- **Zero external dependencies** - runs entirely locally with Ollama

## Demo Scenarios

We've created three interactive demo scenarios to showcase different aspects of the support system:

### 1. New Player Technical Issue

A new player (Level 3) experiencing game crashes during the tutorial phase. This demonstrates:
- Basic technical troubleshooting with Ollama analysis
- Compensation for low-impact issues
- Context-aware responses for new players

### 2. Missing Alliance Rewards

A mid-tier player (Level 12) who's participated in alliance events but didn't receive rewards. This demonstrates:
- Account management issue handling
- Mid-tier compensation analysis with Ollama
- Intelligent issue classification and response

### 3. High-Spender Account Recovery

A VIP player (Level 27, VIP 12) who can't access their account before a major kingdom event. This demonstrates:
- Priority support for high-value players
- Critical issue handling with elevated compensation
- VIP-specific processing and human review flags

## Running the Demo

1. Visit `/demo` to see the available scenarios (automatically warms up llama3.1 model)
2. Select a scenario and click "Start Demo"  
3. **Automated Support Testing**: Visit `/automated-support` to test the intake form and escalation flow
4. The chat will auto-populate with the player's issue
5. **Test escalation flow**: Submit problems via automated support and watch them seamlessly transfer to human chat
6. Interact with the support system
5. **Professional Case Analysis** - Enhanced AI analysis with:
   - Professional third-person incident reports instead of AI chat responses
   - Context-aware responses that reference player level, VIP status, and system logs
   - Specific issue acknowledgments instead of generic "I understand" phrases
6. **Three-Part Response Workflow** - When AI detects issues:
   - Issue Summary popup shows professional case analysis report
   - Three-part response interface: Problem Summary → Solution → Compensation
   - Integrated compensation approval workflow within response interface
   - Automated completion with compensation confirmation and unique ticket reference
7. **Immediate CRM Completion** - After ticket reference is provided:
   - CRM popup appears automatically (no user response wait required)
   - Agent completes case documentation and advances to next scenario
8. Check the admin panel (hamburger menu) to see compensation requests

## Key Features

- **🤖 Local AI Processing**: Powered entirely by Ollama using llama3.1:8b exclusively for all tasks
- **🔥 Model Persistence**: llama3.1 stays loaded with keep-alive system for instant responses
- **⚡ Automated Support Flow**: Complete intake form system with AI-powered routing and immediate escalation display
- **🔄 Seamless Escalation**: Problem descriptions automatically transfer from automated support to human chat with full analysis context
- **🎯 Context-Aware Responses**: Tailored responses based on player level, VIP status, and spending patterns
- **💰 Smart Compensation Analysis**: Automatic issue detection with tier-based compensation recommendations
- **📋 Three-Part Response System**: Structured AI responses parsed into Problem Summary, Solution, and Compensation sections
- **✅ Integrated Approval Workflow**: Compensation approval built directly into response interface with automated completion
- **🎫 Automated Ticket Generation**: Unique 10-digit ticket references provided to players for follow-up support
- **⚡ Immediate CRM Trigger**: Case documentation appears automatically after ticket reference (no user response wait)
- **📊 Professional Case Reports**: Third-person incident summaries and analysis reports instead of first-person AI responses
- **🎭 Contextual Understanding**: AI references specific player details, system logs, and game context in responses
- **🚫 No Generic Responses**: Eliminates generic phrases like "I understand you're having a problem" in favor of specific acknowledgments
- **🔧 Enhanced Parsing**: Robust AI response parsing handles inconsistent formats and prevents duplication
- **🎨 Purple UI Theme**: Disabled buttons and processing states use attractive purple gradient styling
- **🔍 Enhanced Debugging**: Comprehensive logging traces data flow from automated support through chat escalation
- **👥 Admin Dashboard**: Complete management interface for support agents and compensation requests
- **🚀 Zero External Dependencies**: No API keys, cloud services, or external calls required
- **⚡ Real-time Processing**: Instant sentiment analysis, issue classification, and response generation

## 🏗️ Implementation Details

The system uses:
- **🌐 Next.js 15** with App Router for the frontend framework
- **🗄️ Supabase** for database functionality and real-time updates
- **🦙 Ollama** for local AI processing (llama3.1:8b exclusively)
- **🔥 Model persistence system** with keep-alive mechanism for instant responses
- **⚡ Automated support system** with intake forms and intelligent routing
- **🧠 Sentiment analysis** for player issue detection via llama3.1
- **⚡ Real-time compensation tracking** and management
- **📋 TypeScript** for type safety and better development experience
- **🎨 TailwindCSS** for modern, responsive styling with purple theme elements

## 🚀 Local Development

### 📋 Prerequisites
1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull required model** (ONLY llama3.1 needed):
   ```bash
   ollama pull llama3.1:8b    # Used for ALL AI tasks - analysis, chat, sentiment, compensation
   ```
3. **Start Ollama**: Run `ollama serve` (default: http://127.0.0.1:11434)

### ⚙️ Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Configure for Ollama-only setup:
echo "USE_OLLAMA=true" >> .env.local
echo "AI_FALLBACK_TO_GEMINI=false" >> .env.local
echo "OLLAMA_BASE_URL=http://127.0.0.1:11434" >> .env.local

# Add your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_key

# Start development server
npm run dev

# Build for production
npm run build
```

## 🗄️ Database Schema

The system uses these Supabase tables:
- **`support_sessions`**: Tracks player support interactions and chat history
- **`detected_issues`**: Stores AI-analyzed issue detection results from Ollama
- **`compensation_requests`**: Manages compensation packages and approval status
- **`game_resources`**: Stores game documentation for RAG system (currently disabled)

## 🔌 API Routes

- **`/api/chat-smart`**: 🧠 Smart Ollama-based chat with health checking and fallback logic *(Recommended)*
- **`/api/chat-local`**: 🦙 Direct Ollama-only chat endpoint for local processing
- **`/api/chat`**: ❌ Legacy Gemini endpoint *(Deprecated - returns error)*
- **`/api/compensation`**: 💰 Manages compensation request creation and updates
- **`/api/compensation/stats`**: 📊 Provides statistics for the admin dashboard

## 🔧 Environment Variables

### Required Variables
```bash
# Ollama Setup (Required)
USE_OLLAMA=true
AI_FALLBACK_TO_GEMINI=false
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_HEALTH_TIMEOUT=5000

# Database (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development (Optional)
DEBUG_MODE=true
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Ollama Model Required
```bash
# Install the required model for full functionality
ollama pull llama3.1:8b      # All AI tasks: analysis, chat, sentiment, compensation
```

## 📋 Development Commands

```bash
# Development
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Authentication (if needed)
npm run auth:setup   # Initial auth setup
npm run auth:refresh # Refresh auth tokens
```

## 🎯 Getting Started

1. **📖 Read setup guide**: Check `SETUP.md` for detailed installation steps
2. **🎮 Try demos**: Visit `/demo` for interactive scenarios
3. **🔍 Enable debugging**: Set `DEBUG_MODE=true` to see detailed processing
4. **👥 Access admin panel**: Click hamburger menu to manage compensation requests
5. **📊 Monitor performance**: Check browser console for 🦙 Ollama status messages

---

**Ready to revolutionize gaming support with local AI?** 🚀 No API keys, no cloud dependencies - just powerful local processing with Ollama!