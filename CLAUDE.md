# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Quimbi AI** is a local AI-powered customer support system for a Game of Thrones-themed mobile strategy game. The system combines Ollama-driven chat interactions with intelligent issue detection and compensation management.

**Current Architecture**: Pure Ollama-only setup with no external API dependencies. All AI processing runs locally using llama3.1 models exclusively for optimal performance and model persistence.

### Key Features
- **🤖 Local AI Processing**: Powered entirely by Ollama using llama3.1 models exclusively
- **🔥 Model Persistence**: llama3.1 stays loaded and warm for instant responses via keep-alive system
- **⚡ Automated Support Flow**: AI-powered intake form with immediate escalation analysis
- **🎯 Context-aware chat** using player profile data (level, VIP status, spending history)
- **💰 Intelligent issue detection** with automatic compensation recommendations using Ollama
- **✅ Approval Workflow**: AI responses requiring compensation are intercepted and blocked until agent approval
- **👥 Admin panel** for support agents to manage compensation requests
- **🔄 Seamless Escalation**: Problem descriptions automatically pass from automated support to human chat with full analysis
- **⚡ Real-time sentiment analysis** and player message processing via Ollama models
- **🚀 Zero external dependencies** - no API keys or cloud services required

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture Overview

### Frontend Structure
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **TailwindCSS** for styling
- **Components** in `/app/components/` - modular UI components
- **Hooks** in `/app/hooks/` - custom React hooks for state management

### Backend Architecture
- **API Routes** in `/app/api/` handle all server-side logic
- **Smart chat endpoint** at `/api/chat-smart/route.ts` with Ollama health checking and model warmup support
- **Local chat endpoint** at `/api/chat-local/route.ts` for direct Ollama usage with warmup functionality
- **Automated support endpoints**:
  - `/api/analyze-problem/route.ts` - AI-powered problem categorization and routing decisions
  - `/api/analyze-player-message/route.ts` - Full issue analysis for escalated cases
- **Model persistence endpoint** at `/api/model-persistence/route.ts` - Manages llama3.1 keep-alive system
- **Deprecated chat endpoint** at `/api/chat/route.ts` (legacy Gemini-based, returns errors)
- **Compensation API** at `/api/compensation/` manages compensation requests and statistics

### Core Services (`/lib/`)

#### RAG System (`rag.ts`) - DISABLED
- **Status**: All functions return stubs to avoid Google Cloud dependencies
- **Rationale**: Ollama models provide sufficient context understanding without external embeddings
- **File kept for interface compatibility** - all functions return empty results with warnings

#### Compensation Engine (`compensation-local.ts` + `compensation.ts`)
- **Active implementation**: `compensation-local.ts` with full Ollama integration using llama3.1 exclusively
- **Issue detection** using llama3.1 for structured analysis and reasoning
- **Sentiment analysis** using llama3.1 with tone, urgency, and repeat issue detection
- **Compensation tiers** (P0-P5) with automatic package calculation based on impact
- **Deception detection** comparing player claims against system context via llama3.1
- **VIP handling** with elevated review processes for high-tier players (VIP 10+)
- **Approval Workflow**: AI responses requiring compensation are analyzed upfront and require agent approval before being sent to players
- **Deprecated stub**: `compensation.ts` returns errors directing to local implementation

#### Automated Support System (`automated-resolution.ts` + UI Components)
- **Rule-based automated resolution** for common support issues (account access, missing rewards, purchases, technical)
- **AutomatedSupportFlow.tsx**: Complete intake form workflow with identity verification and problem categorization
- **AutomatedIntakeForm.tsx**: Multi-step form with real-time AI analysis and routing decisions
- **AutomatedResolutionDisplay.tsx**: Results display with purple-themed UI and escalation options
- **Immediate escalation display**: "Transferring to Human Agent" page appears instantly when AI decides to escalate
- **Background analysis**: Full compensation analysis runs during transfer for immediate agent context

#### Three-Part Response Workflow System (`RAGChatHandler.tsx` + `ThreePartResponse.tsx`)
- **Upfront Analysis**: `/api/chat-smart` analyzes player messages for compensation needs BEFORE generating responses
- **Context-Aware AI**: AI generates responses with full knowledge of compensation decisions included in system prompt
- **Structured Decision Flow**: Player Message → AI Analysis → Issue Summary Popup → Three-Part Response Interface → Automated Workflow
- **Three-Part Structure**: AI responses are parsed into Problem Summary, Solution, and Compensation sections
- **Integrated Approval**: Compensation approval workflow is built directly into the three-part response interface
- **Automated Completion**: After all parts are sent, system automatically sends compensation confirmation and ticket reference
- **Immediate CRM Trigger**: CRM popup appears immediately after ticket message (no user response required)
- **Enhanced Parsing**: Robust parsing handles inconsistent AI response formats and prevents duplication
- **State Management**: Comprehensive state tracking prevents duplicate messages and ensures proper workflow progression
- **Debug Logging**: Extensive logging shows data transformation, parsing analysis, and workflow progression

#### System Prompts (`system-prompts.ts`)
- **Stage-specific prompts** based on player level (1-5, 6-10, 11-15, etc.)
- **Support type prompts** for gameplay, technical, and account issues
- **Compensation guidance** with tier-based recommendations

#### Database Integration (`supabase.ts`)
- **Supabase client** for database operations
- **Admin client** for elevated permissions
- **Schema** includes support_sessions, detected_issues, compensation_requests

### AI Integration
- **Ollama** for all AI processing using llama3.1:8b exclusively
- **Model Persistence System** (`ollama-persistence.ts`): Keep-alive mechanism with 5-minute ping intervals to prevent model unloading
- **Model Warmup**: llama3.1 pre-loads when `/demo` page is accessed for faster first responses
- **AI provider abstraction** via `ai-provider-switch.ts` (simplified to Ollama-only)
- **Streaming responses** with real-time streaming for Ollama models
- **Health checking** automatic model availability detection with timeout handling
- **Debug mode** available via DEBUG_MODE flag - shows detailed Ollama processing steps (🦙 prefix)
- **Error handling** graceful fallbacks when Ollama is unavailable

### Escalation Flow & Message Passing
- **Seamless problem transfer**: Original problem descriptions automatically pass from automated support to human chat
- **Enhanced debugging**: Comprehensive logging traces data flow from escalation to chat rendering
- **Automatic initial message**: Chat sessions auto-start with the user's original problem description
- **Full analysis context**: Escalated cases include complete AI analysis (issue type, sentiment, compensation recommendations) in agent context
- **localStorage-based handoff**: Robust data persistence ensures no information loss during page transitions

## Database Schema

### Key Tables
- `support_sessions` - Player session tracking
- `detected_issues` - Issue analysis results
- `compensation_requests` - Compensation packages and status
- `game_resources` - RAG document storage with embeddings

### Important Functions
- `match_documents()` - Semantic search function for RAG
- `get_handling_time_stats()` - Analytics for admin dashboard

## Environment Variables

### Required for Ollama-only setup:
- `USE_OLLAMA=true` - Force Ollama usage (required)
- `AI_FALLBACK_TO_GEMINI=false` - Disable Gemini fallback (required)
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://127.0.0.1:11434)
- `OLLAMA_HEALTH_TIMEOUT` - Health check timeout in ms (default: 5000)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` - Database connection
- `DEBUG_MODE=true` - Enable detailed debug logging with 🦙 prefixes

### Model Requirements:
**Only llama3.1 is required:**
```bash
ollama pull llama3.1:8b  # Used for ALL tasks: analysis, chat, sentiment, compensation
```
Note: qwen models are no longer used to maintain model consistency and persistence.

## Development Workflow

### Adding New Features
1. **Components** - Create in `/app/components/` following existing patterns
2. **API Routes** - Add to `/app/api/` with proper error handling
3. **Database changes** - Update schema in `/schema.sql` and TypeScript interfaces
4. **AI Integration** - Extend prompts in `/lib/system-prompts.ts` for new scenarios

### Testing Approach
- **Demo scenarios** available at `/demo` route (triggers automatic llama3.1 warmup)
- **Automated support testing** at `/automated-support` route for intake form and escalation flow
- **Admin panel** accessible via hamburger menu
- **Model persistence status** can be checked via `/api/model-persistence` endpoint
- Use different player contexts to test compensation logic
- Monitor debug output in console when DEBUG_MODE is enabled
- **Escalation flow testing**: Test problem description transfer from automated support to chat
- **UI testing**: Submit button changes to purple when disabled/processing

### Common Development Tasks

#### Modifying Compensation Logic
- **Ollama version**: Update `compensation-local.ts` functions like `detectIssue()`, `analyzeSentiment()` (all use llama3.1)
- **Data Flow**: `analyzePlayerMessage()` returns `{issueDetected, issue, sentiment, compensation}` → transformed to `{issueDetected, issue, sentiment, recommendation}` in frontend
- **Escalation analysis**: `/api/analyze-player-message` provides full analysis during escalation for immediate agent context
- **Deprecated version**: `compensation.ts` functions throw errors directing to local implementation
- Adjust issue detection prompts in llama3.1 functions for better accuracy
- Modify deception detection prompts in `analyzePlayerClaim()` function (uses llama3.1)

#### Modifying Three-Part Response Workflow
- **AI Response Parsing**: Update parsing logic in `/api/chat-smart/route.ts` lines 203-293 to handle different AI response formats
- **System Prompt Integration**: Modify format requirements in system prompts (lines 82-122) to ensure consistent AI output
- **Enhanced Parsing**: Duplication detection and first-match extraction for malformed responses with section headers
- **Workflow Integration**: Update `ThreePartResponse.tsx` for integrated compensation approval and section management
- **State Management**: Modify `RAGChatHandler.tsx` state tracking to prevent duplicate messages and ensure proper progression
- **Automated Completion**: Adjust timing and triggers for compensation confirmation and ticket reference messages
- **CRM Integration**: Modify when CRM popup is triggered - currently immediate after ticket message (no user response wait)
- **Testing**: Use demo scenarios at `/demo` to verify end-to-end three-part response workflow and immediate CRM trigger
- **Debug Mode**: Enable detailed logging to trace parsing, workflow progression, and state transitions

#### RAG System (Disabled)
- **Status**: RAG functions disabled to eliminate Google Cloud dependencies
- **Current behavior**: All RAG functions return empty results with warning logs
- **Alternative**: Use Ollama's built-in knowledge and context windows for game support
- **Re-enabling**: Would require implementing local embeddings or vector database

#### Adding New Player Context
- Update `PlayerContext` interface in `/app/types/player.ts`
- Extend form in `PlayerContextForm.tsx` component
- Modify system prompt generation to use new context fields

#### Modifying Automated Support System
- **Intake form changes**: Update `AutomatedIntakeForm.tsx` for new form fields or validation
- **Resolution logic**: Modify `automated-resolution.ts` for new automated resolution patterns
- **Escalation flow**: Update `AutomatedSupportFlow.tsx` and `/app/automated-support/page.tsx` for escalation behavior
- **UI styling**: Automated components use purple theme for disabled states and processing indicators
- **Analysis integration**: Escalation automatically triggers `/api/analyze-player-message` for immediate agent context

## Important Notes

- **Architecture**: Pure Ollama-only setup eliminates all external API dependencies
- **Model Requirements**: ONLY llama3.1:8b is required:
  ```bash
  ollama pull llama3.1:8b  # Used for ALL AI tasks
  ```
- **Model Persistence**: llama3.1 stays loaded via keep-alive system for instant responses
- **Model Warmup**: Accessing `/demo` automatically warms up llama3.1 for faster first use
- **Health Checking**: System automatically detects Ollama availability and shows status
- **Security**: No API keys required - everything runs locally via Ollama
- **Debug Logging**: Enable with `DEBUG_MODE=true` to see detailed processing (🦙 = Ollama operations)
- **VIP Handling**: Players with VIP level 10+ get elevated review processes and priority
- **Automated Support**: Complete intake form system with AI-powered routing and immediate escalation display
- **Seamless Escalation**: Problem descriptions automatically transfer from automated support to human chat with full analysis context
- **Three-Part Response**: Player messages are analyzed upfront; AI responses are parsed into structured Problem Summary, Solution, and Compensation sections
- **Automated Workflow**: After agent sends all response parts, system automatically sends compensation confirmation and unique ticket reference
- **Immediate CRM**: CRM popup appears immediately after ticket message - no user response required for workflow completion
- **Professional Reporting**: Issue summary popup uses third-person professional case report format instead of first-person AI responses
- **Robust Parsing**: Advanced parsing handles inconsistent AI response formats, detects duplication, and prevents malformed output
- **Purple UI Theme**: Disabled buttons and processing states use purple gradient styling
- **Enhanced Debugging**: Comprehensive logging traces data flow from automated support through chat escalation
- **Testing**: Use demo scenarios at `/demo` to verify end-to-end workflows including escalation flow testing
- **Performance**: Processing speed depends on local hardware; model persistence improves response times
- **Fallbacks**: System gracefully handles Ollama unavailability with error messages